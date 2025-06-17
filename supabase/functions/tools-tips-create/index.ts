import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreatePostRequest {
  title: string
  content: string
  category: 'tool' | 'tip'
  tags: string[]
  image_url?: string
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

    // Parse request body
    const body: CreatePostRequest = await req.json()

    // Validate required fields
    if (!body.title || !body.content || !body.category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, content, category' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate category
    if (!['tool', 'tip'].includes(body.category)) {
      return new Response(
        JSON.stringify({ error: 'Category must be either "tool" or "tip"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create the post
    const { data: post, error: postError } = await supabaseClient
      .from('community_posts')
      .insert({
        title: body.title,
        content: body.content,
        category: body.category,
        author_id: user.id,
        image_url: body.image_url,
      })
      .select(`
        *,
        author:profiles(name, avatar_url)
      `)
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return new Response(
        JSON.stringify({ error: 'Failed to create post' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Add tags if provided
    if (body.tags && body.tags.length > 0) {
      const tagInserts = body.tags.map(tag => ({
        post_id: post.id,
        tag: tag.toLowerCase().trim(),
      }))

      const { error: tagsError } = await supabaseClient
        .from('community_post_tags')
        .insert(tagInserts)

      if (tagsError) {
        console.error('Error adding tags:', tagsError)
        // Don't fail the request if tags fail, just log it
      }
    }

    return new Response(
      JSON.stringify({ data: post }),
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