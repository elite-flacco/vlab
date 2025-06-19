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

    // Parse URL parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50) // Max 50 items per page
    const category = url.searchParams.get('category')
    const tool = url.searchParams.get('tool')
    const tip_category = url.searchParams.get('tip_category')
    const sortBy = url.searchParams.get('sort') || 'newest'
    const search = url.searchParams.get('search')
    const tag = url.searchParams.get('tag')

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseClient
      .from('community_posts')
      .select(`
        *,
        author:profiles(name, avatar_url),
        tags:community_post_tags(tag),
        user_vote:community_post_votes(vote_type),
        user_saved:community_post_saves(id)
      `, { count: 'exact' })
      .eq('is_published', true)

    // Apply filters
    if (category && ['tool', 'tip'].includes(category)) {
      query = query.eq('category', category)
    }

    if (tool) {
      query = query.eq('tool', tool)
    }

    if (tip_category) {
      query = query.eq('tip_category', tip_category)
    }

    if (search) {
      query = query.textSearch('title,content', search)
    }

    if (tag) {
      query = query.contains('tags', [{ tag }])
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('upvotes', { ascending: false })
        break
      case 'trending':
        // Simple trending: high upvotes in recent time
        query = query
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('upvotes', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch posts' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return new Response(
      JSON.stringify({
        data: posts,
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNextPage,
          hasPrevPage,
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