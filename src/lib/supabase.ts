// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types for our database
export type User = {
  id: string;
  fid: number;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  created_at: string;
  last_login: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  cast_hash: string;
  cast_author_fid: number | null;
  cast_author_username: string | null;
  cast_content: string | null;
  cast_timestamp: string | null;
  note: string | null;
  created_at: string;
  is_private: boolean;
  tags?: Tag[];
};

export type Tag = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  bookmarks?: Bookmark[];
};
