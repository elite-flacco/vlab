import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  login: string;
  id: number;
  name: string;
  email: string;
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

    const { code, state } = await req.json()

    if (!code) {
      throw new Error('Missing authorization code')
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: Deno.env.get('GITHUB_CLIENT_ID'),
        client_secret: Deno.env.get('GITHUB_CLIENT_SECRET'),
        code,
        state,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData: GitHubTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('No access token received from GitHub')
    }

    // Get user information from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VLab-GitHub-Integration/1.0',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get user information from GitHub')
    }

    const userData: GitHubUserResponse = await userResponse.json()

    // Encrypt the token (simple base64 encoding for now - in production, use proper encryption)
    const encryptedToken = btoa(tokenData.access_token)

    // Store the token in the database
    const { data: existingToken } = await supabaseClient
      .from('github_tokens')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabaseClient
        .from('github_tokens')
        .update({
          encrypted_token: encryptedToken,
          token_scope: tokenData.scope.split(','),
          github_username: userData.login,
          github_user_id: userData.id.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingToken.id)

      if (updateError) {
        throw updateError
      }
    } else {
      // Create new token
      const { error: insertError } = await supabaseClient
        .from('github_tokens')
        .insert({
          user_id: user.id,
          encrypted_token: encryptedToken,
          token_scope: tokenData.scope.split(','),
          github_username: userData.login,
          github_user_id: userData.id.toString(),
          is_active: true,
        })

      if (insertError) {
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        github_username: userData.login,
        scopes: tokenData.scope.split(','),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('GitHub OAuth exchange error:', error)
    
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