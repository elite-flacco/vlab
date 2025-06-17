import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Get the current user (optional for viewing)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    // Fetch post details
    const { data: post, error: postError } = await supabaseClient
      .from('community_posts')
      .select(`
        *,
        author:profiles(name, avatar_url),
        tags:community_post_tags(tag),
        user_vote:community_post_votes(vote_type),
        user_saved:community_post_saves(id)
      `)
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

    // Fetch comments
    const { data: comments, error: commentsError } = await supabaseClient
      .from('community_comments')
      .select(`
        *,
        author:profiles(name, avatar_url),
        user_vote:community_comment_votes(vote_type)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      // Don't fail the request if comments fail
    }

    // Increment view count (fire and forget)
    if (user) {
      supabaseClient
        .from('community_posts')
        .update({ view_count: post.view_count + 1 })
        .eq('id', postId)
        .then(() => {})
        .catch(() => {})
    }

    // Organize comments into threads
    const commentMap = new Map()
    const rootComments: any[] = []

    if (comments) {
      // First pass: create map of all comments
      comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] })
      })

      // Second pass: organize into threads
      comments.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id)
          if (parent) {
            parent.replies.push(commentMap.get(comment.id))
          }
        } else {
          rootComments.push(commentMap.get(comment.id))
        }
      })
    }

    return new Response(
      JSON.stringify({
        data: {
          ...post,
          comments: rootComments,
        },
      }),
      {
        status: 200,
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