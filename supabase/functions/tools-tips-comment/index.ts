import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CommentRequest {
  content: string
  parent_comment_id?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Extract post ID from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const postId = pathParts[pathParts.length - 1]

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const body: CommentRequest = await req.json()

    if (!body.content || body.content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comment content is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the post exists and is published
    const { data: post, error: postError } = await supabaseClient
      .from('community_posts')
      .select('id')
      .eq('id', postId)
      .eq('is_published', true)
      .single()

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If replying to a comment, verify the parent comment exists
    if (body.parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseClient
        .from('community_comments')
        .select('id')
        .eq('id', body.parent_comment_id)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .single()

      if (parentError || !parentComment) {
        return new Response(
          JSON.stringify({ error: 'Parent comment not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabaseClient
      .from('community_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: body.content.trim(),
        parent_comment_id: body.parent_comment_id || null,
      })
      .select(`
        *,
        author:profiles(name, avatar_url)
      `)
      .single()

    if (commentError) {
      console.error('Error creating comment:', commentError)
      return new Response(
        JSON.stringify({ error: 'Failed to create comment' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ data: comment }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})