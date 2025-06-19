import { supabase } from './supabase';

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface CreatePostData {
  title: string
  content: string
  category: 'tool' | 'tip'
  tool?: string
  tip_category?: string
  tags: string[]
  image_url?: string
}

interface ListPostsParams {
  page?: number;
  limit?: number;
  category?: 'tool' | 'tip';
  tool?: string;
  tip_category?: string;
  sort?: 'newest' | 'oldest' | 'popular' | 'trending';
  search?: string;
  tag?: string;
}

interface CommentData {
  content: string;
  parent_comment_id?: string;
}

interface VoteData {
  vote_type: 'upvote' | 'downvote';
}

class CommunityAPI {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async createPost(data: CreatePostData) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/tools-tips-create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }

    return response.json();
  }

  async listPosts(params: ListPostsParams = {}) {
    const headers = await this.getAuthHeaders();
    
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.category) searchParams.set('category', params.category);
    if (params.tool) searchParams.set('tool', params.tool);
    if (params.tip_category) searchParams.set('tip_category', params.tip_category);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.search) searchParams.set('search', params.search);
    if (params.tag) searchParams.set('tag', params.tag);

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/tools-tips-list?${searchParams}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch posts');
    }

    return response.json();
  }

  async getPost(postId: string) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/tools-tips-detail/${postId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch post');
    }

    return response.json();
  }

  async votePost(postId: string, voteData: VoteData) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/tools-tips-vote/${postId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(voteData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to vote');
    }

    return response.json();
  }

  async removeVote(postId: string) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/tools-tips-vote/${postId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove vote');
    }

    return response.json();
  }

  async addComment(postId: string, commentData: CommentData) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/tools-tips-comment/${postId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add comment');
    }

    return response.json();
  }

  async savePost(postId: string) {
    const { data, error } = await supabase
      .from('community_post_saves')
      .insert({ post_id: postId, user_id: (await supabase.auth.getUser()).data.user?.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async unsavePost(postId: string) {
    const { error } = await supabase
      .from('community_post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
  }

  async updatePost(postId: string, updates: Partial<CreatePostData>) {
    const { data, error } = await supabase
      .from('community_posts')
      .update(updates)
      .eq('id', postId)
      .select(`
        *,
        author:profiles(name, avatar_url),
        tags:community_post_tags(tag)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }

  async getUserPosts(userId: string, params: ListPostsParams = {}) {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles(name, avatar_url),
        tags:community_post_tags(tag)
      `)
      .eq('author_id', userId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range((params.page || 1 - 1) * (params.limit || 10), (params.page || 1) * (params.limit || 10) - 1);

    if (error) throw error;
    return data;
  }

  async getSavedPosts(params: ListPostsParams = {}) {
    const { data, error } = await supabase
      .from('community_post_saves')
      .select(`
        post:community_posts(
          *,
          author:profiles(name, avatar_url),
          tags:community_post_tags(tag)
        )
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false })
      .range((params.page || 1 - 1) * (params.limit || 10), (params.page || 1) * (params.limit || 10) - 1);

    if (error) throw error;
    return data.map(item => item.post);
  }
}

export const communityApi = new CommunityAPI();