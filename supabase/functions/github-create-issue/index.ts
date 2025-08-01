import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateIssueRequest {
  taskId: string;
  repositoryId: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

interface GitHubIssueResponse {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const { taskId, repositoryId, title, body, labels, assignees }: CreateIssueRequest = await req.json()

    if (!taskId || !repositoryId || !title) {
      throw new Error('Missing required fields: taskId, repositoryId, title')
    }

    // Get the GitHub token for the user
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('github_tokens')
      .select('encrypted_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (tokenError || !tokenData) {
      throw new Error('No GitHub token found. Please connect your GitHub account first.')
    }

    // Decrypt the token (simple base64 decoding - in production, use proper decryption)
    const accessToken = atob(tokenData.encrypted_token)

    // Get repository information
    const { data: repoData, error: repoError } = await supabaseClient
      .from('github_repositories')
      .select('repo_owner, repo_name, repo_full_name')
      .eq('id', repositoryId)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repoData) {
      throw new Error('Repository not found or access denied')
    }

    // Check if issue already exists for this task
    const { data: existingIssue } = await supabaseClient
      .from('github_issues')
      .select('github_issue_number, github_issue_url')
      .eq('task_id', taskId)
      .single()

    if (existingIssue) {
      throw new Error(`GitHub issue already exists for this task: #${existingIssue.github_issue_number}`)
    }

    // Create the issue on GitHub
    const issuePayload: any = {
      title,
      body: body || '',
    };

    // Only include labels if they exist and are non-empty
    if (labels && labels.length > 0) {
      issuePayload.labels = labels;
    }

    // Only include assignees if they exist and are non-empty
    if (assignees && assignees.length > 0) {
      issuePayload.assignees = assignees;
    }

    const githubResponse = await fetch(`https://api.github.com/repos/${repoData.repo_full_name}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'VLab-GitHub-Integration/1.0',
      },
      body: JSON.stringify(issuePayload),
    })

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json().catch(() => ({}))
      throw new Error(`GitHub API error: ${githubResponse.status} ${githubResponse.statusText}. ${errorData.message || 'Unknown error'}`)
    }

    const issueData: GitHubIssueResponse = await githubResponse.json()

    // Store the issue in our database
    const { data: dbIssue, error: dbError } = await supabaseClient
      .from('github_issues')
      .insert({
        task_id: taskId,
        repository_id: repositoryId,
        github_issue_number: issueData.number,
        github_issue_url: issueData.html_url,
        issue_title: issueData.title,
        issue_body: issueData.body,
        github_issue_state: issueData.state,
        created_by: user.id,
      })
      .select(`
        *,
        repository:github_repositories(*)
      `)
      .single()

    if (dbError) {
      console.error('Failed to store issue in database:', dbError)
      // Issue was created on GitHub but failed to store in DB
      // In a production system, we might want to implement cleanup here
    }

    return new Response(
      JSON.stringify({
        success: true,
        issue: {
          number: issueData.number,
          title: issueData.title,
          url: issueData.html_url,
          state: issueData.state,
        },
        dbRecord: dbIssue,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('GitHub create issue error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})