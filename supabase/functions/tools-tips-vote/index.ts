import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
}

interface VoteRequest {
  vote_type: 'upvote' | 'downvote'
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

    if (req.method === 'POST') {
      // Add or update vote
      const body: VoteRequest = await req.json()

      if (!body.vote_type || !['upvote', 'downvote'].includes(body.vote_type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid vote_type. Must be "upvote" or "downvote"' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Upsert the vote (insert or update if exists)
      const { data: vote, error: voteError } = await supabaseClient
        .from('community_post_votes')
        .upsert({
          post_id: postId,
          user_id: user.id,
          vote_type: body.vote_type,
        })
        .select()
        .single()

      if (voteError) {
        console.error('Error creating/updating vote:', voteError)
        return new Response(
          JSON.stringify({ error: 'Failed to vote' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ data: vote }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (req.method === 'DELETE') {
      // Remove vote
      const { error: deleteError } = await supabaseClient
        .from('community_post_votes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting vote:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to remove vote' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Vote removed successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
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