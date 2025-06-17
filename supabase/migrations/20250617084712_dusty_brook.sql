/*
  # Community Tools & Tips Feature

  1. New Tables
    - `community_posts` - Main posts for tools and tips
    - `community_comments` - Comments on posts
    - `community_post_votes` - User votes (upvotes/downvotes)
    - `community_post_saves` - User saved posts
    - `community_post_tags` - Tags for posts

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Public read access for posts, authenticated write access

  3. Features
    - Full-text search capabilities
    - Vote tracking with constraints
    - Tag system for categorization
    - Image upload support
*/

-- Community Posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('tool', 'tip')),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Community Comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Community Post Votes table
CREATE TABLE IF NOT EXISTS community_post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one vote per user per post
  UNIQUE(post_id, user_id)
);

-- Community Comment Votes table
CREATE TABLE IF NOT EXISTS community_comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one vote per user per comment
  UNIQUE(comment_id, user_id)
);

-- Community Post Saves table
CREATE TABLE IF NOT EXISTS community_post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one save per user per post
  UNIQUE(post_id, user_id)
);

-- Community Post Tags table
CREATE TABLE IF NOT EXISTS community_post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique tags per post
  UNIQUE(post_id, tag)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_upvotes ON community_posts(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_published ON community_posts(is_published);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author_id ON community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_community_comment_votes_comment_id ON community_comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_votes_user_id ON community_comment_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_community_post_saves_user_id ON community_post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_saves_post_id ON community_post_saves(post_id);

CREATE INDEX IF NOT EXISTS idx_community_post_tags_post_id ON community_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_tags_tag ON community_post_tags(tag);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_community_posts_search ON community_posts USING gin(to_tsvector('english', title || ' ' || content));

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Anyone can view published posts"
  ON community_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Users can view own posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can create posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for community_comments
CREATE POLICY "Anyone can view comments on published posts"
  ON community_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_posts 
      WHERE community_posts.id = community_comments.post_id 
      AND community_posts.is_published = true
    )
    AND is_deleted = false
  );

CREATE POLICY "Users can create comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON community_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for community_post_votes
CREATE POLICY "Users can view all votes"
  ON community_post_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own votes"
  ON community_post_votes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for community_comment_votes
CREATE POLICY "Users can view all comment votes"
  ON community_comment_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own comment votes"
  ON community_comment_votes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for community_post_saves
CREATE POLICY "Users can view own saves"
  ON community_post_saves FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own saves"
  ON community_post_saves FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for community_post_tags
CREATE POLICY "Anyone can view tags"
  ON community_post_tags FOR SELECT
  USING (true);

CREATE POLICY "Users can manage tags for own posts"
  ON community_post_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_posts 
      WHERE community_posts.id = community_post_tags.post_id 
      AND community_posts.author_id = auth.uid()
    )
  );

-- Function to update post vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post vote counts
    UPDATE community_posts 
    SET 
      upvotes = (
        SELECT COUNT(*) FROM community_post_votes 
        WHERE post_id = NEW.post_id AND vote_type = 'upvote'
      ),
      downvotes = (
        SELECT COUNT(*) FROM community_post_votes 
        WHERE post_id = NEW.post_id AND vote_type = 'downvote'
      )
    WHERE id = NEW.post_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update post vote counts for both old and new posts if different
    UPDATE community_posts 
    SET 
      upvotes = (
        SELECT COUNT(*) FROM community_post_votes 
        WHERE post_id = NEW.post_id AND vote_type = 'upvote'
      ),
      downvotes = (
        SELECT COUNT(*) FROM community_post_votes 
        WHERE post_id = NEW.post_id AND vote_type = 'downvote'
      )
    WHERE id = NEW.post_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update post vote counts
    UPDATE community_posts 
    SET 
      upvotes = (
        SELECT COUNT(*) FROM community_post_votes 
        WHERE post_id = OLD.post_id AND vote_type = 'upvote'
      ),
      downvotes = (
        SELECT COUNT(*) FROM community_post_votes 
        WHERE post_id = OLD.post_id AND vote_type = 'downvote'
      )
    WHERE id = OLD.post_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_comments 
    SET 
      upvotes = (
        SELECT COUNT(*) FROM community_comment_votes 
        WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'
      ),
      downvotes = (
        SELECT COUNT(*) FROM community_comment_votes 
        WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'
      )
    WHERE id = NEW.comment_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE community_comments 
    SET 
      upvotes = (
        SELECT COUNT(*) FROM community_comment_votes 
        WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'
      ),
      downvotes = (
        SELECT COUNT(*) FROM community_comment_votes 
        WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'
      )
    WHERE id = NEW.comment_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments 
    SET 
      upvotes = (
        SELECT COUNT(*) FROM community_comment_votes 
        WHERE comment_id = OLD.comment_id AND vote_type = 'upvote'
      ),
      downvotes = (
        SELECT COUNT(*) FROM community_comment_votes 
        WHERE comment_id = OLD.comment_id AND vote_type = 'downvote'
      )
    WHERE id = OLD.comment_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment counts on posts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comment_count = (
      SELECT COUNT(*) FROM community_comments 
      WHERE post_id = NEW.post_id AND is_deleted = false
    )
    WHERE id = NEW.post_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update comment count for the post
    UPDATE community_posts 
    SET comment_count = (
      SELECT COUNT(*) FROM community_comments 
      WHERE post_id = NEW.post_id AND is_deleted = false
    )
    WHERE id = NEW.post_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comment_count = (
      SELECT COUNT(*) FROM community_comments 
      WHERE post_id = OLD.post_id AND is_deleted = false
    )
    WHERE id = OLD.post_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER update_post_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON community_post_votes
  FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

CREATE TRIGGER update_comment_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON community_comment_votes
  FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();

CREATE TRIGGER update_post_comment_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Create trigger for updated_at
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE community_posts IS 'Community posts for tools and tips sharing';
COMMENT ON TABLE community_comments IS 'Comments on community posts with threading support';
COMMENT ON TABLE community_post_votes IS 'User votes on community posts';
COMMENT ON TABLE community_comment_votes IS 'User votes on community comments';
COMMENT ON TABLE community_post_saves IS 'User saved posts for later reference';
COMMENT ON TABLE community_post_tags IS 'Tags for categorizing community posts';