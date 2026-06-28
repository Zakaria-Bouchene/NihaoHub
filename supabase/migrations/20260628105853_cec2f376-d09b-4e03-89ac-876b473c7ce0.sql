
-- Item kind enum
CREATE TYPE public.item_kind AS ENUM ('word', 'sentence', 'text');
CREATE TYPE public.review_rating AS ENUM ('again', 'hard', 'good', 'easy');
CREATE TYPE public.flag_kind AS ENUM ('difficult', 'favorite');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Words
CREATE TABLE public.words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chinese TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  hsk_level SMALLINT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.words TO authenticated;
GRANT SELECT ON public.words TO anon;
GRANT ALL ON public.words TO service_role;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public words readable" ON public.words FOR SELECT USING (is_public OR auth.uid() = created_by);
CREATE POLICY "Auth insert words" ON public.words FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates words" ON public.words FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator deletes words" ON public.words FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Sentences
CREATE TABLE public.sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chinese TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sentences TO authenticated;
GRANT SELECT ON public.sentences TO anon;
GRANT ALL ON public.sentences TO service_role;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sentences readable" ON public.sentences FOR SELECT USING (is_public OR auth.uid() = created_by);
CREATE POLICY "Auth insert sentences" ON public.sentences FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates sentences" ON public.sentences FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator deletes sentences" ON public.sentences FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Reading texts
CREATE TABLE public.texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinyin TEXT,
  translation TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.texts TO authenticated;
GRANT SELECT ON public.texts TO anon;
GRANT ALL ON public.texts TO service_role;
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public texts readable" ON public.texts FOR SELECT USING (is_public OR auth.uid() = created_by);
CREATE POLICY "Auth insert texts" ON public.texts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates texts" ON public.texts FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator deletes texts" ON public.texts FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Collections
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  cloned_from UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read public or own collections" ON public.collections FOR SELECT USING (is_public OR auth.uid() = owner_id);
CREATE POLICY "Auth insert collections" ON public.collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates collections" ON public.collections FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owner deletes collections" ON public.collections FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Collection items (words / sentences / texts)
CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_kind public.item_kind NOT NULL,
  item_id UUID NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, item_kind, item_id)
);
CREATE INDEX collection_items_collection_idx ON public.collection_items(collection_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT SELECT ON public.collection_items TO anon;
GRANT ALL ON public.collection_items TO service_role;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items of visible collections" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public OR c.owner_id = auth.uid()))
);
CREATE POLICY "Owner manages items" ON public.collection_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = auth.uid())
);

-- Reviews (every Again/Hard/Good/Easy click)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_kind public.item_kind NOT NULL,
  item_id UUID NOT NULL,
  rating public.review_rating NOT NULL,
  reverse_mode BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reviews_user_idx ON public.reviews(user_id, reviewed_at DESC);
CREATE INDEX reviews_item_idx ON public.reviews(user_id, item_kind, item_id);
GRANT SELECT, INSERT, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reviews readable" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own reviews insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own reviews delete" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Flags: difficult / favorite
CREATE TABLE public.user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_kind public.item_kind NOT NULL,
  item_id UUID NOT NULL,
  flag public.flag_kind NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_kind, item_id, flag)
);
CREATE INDEX user_flags_user_idx ON public.user_flags(user_id, flag);
GRANT SELECT, INSERT, DELETE ON public.user_flags TO authenticated;
GRANT ALL ON public.user_flags TO service_role;
ALTER TABLE public.user_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own flags readable" ON public.user_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own flags insert" ON public.user_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own flags delete" ON public.user_flags FOR DELETE USING (auth.uid() = user_id);
