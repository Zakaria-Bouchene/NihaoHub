-- Drop triggers that depend on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Drop foreign key constraints linking to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.words DROP CONSTRAINT IF EXISTS words_created_by_fkey;
ALTER TABLE public.sentences DROP CONSTRAINT IF EXISTS sentences_created_by_fkey;
ALTER TABLE public.texts DROP CONSTRAINT IF EXISTS texts_created_by_fkey;
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_owner_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.user_flags DROP CONSTRAINT IF EXISTS user_flags_user_id_fkey;
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_created_by_fkey;
ALTER TABLE public.reading_passages DROP CONSTRAINT IF EXISTS reading_passages_created_by_fkey;

-- Change columns from UUID to TEXT to store Firebase string UIDs
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.words ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.sentences ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.texts ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.collections ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE public.reviews ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_flags ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.cards ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.reading_passages ALTER COLUMN created_by TYPE TEXT;

-- Since Firebase manages users, we can recreate the profiles trigger if desired by inserting a row manually in the app,
-- or we can just rely on the app inserting into `profiles` via a server function when a user first signs in.

-- Notice: Row Level Security (RLS) policies that use `auth.uid()` will no longer match the TEXT column type 
-- directly if `auth.uid()` returns UUID. However, since we are using a Service Role key to bypass RLS in our 
-- Tanstack Start server functions, we can safely disable RLS or just leave it as-is, because the service role 
-- skips RLS completely. To avoid confusion, we disable RLS on tables where user queries are fully managed by the server.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.words DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.texts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_passages DISABLE ROW LEVEL SECURITY;
