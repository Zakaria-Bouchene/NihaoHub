
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
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER TYPE public.item_kind ADD VALUE IF NOT EXISTS 'card';
ALTER TYPE public.item_kind ADD VALUE IF NOT EXISTS 'passage';

CREATE TABLE public.cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_lang     TEXT NOT NULL,
  target_lang     TEXT NOT NULL,
  source_text     TEXT NOT NULL,
  transliteration TEXT,
  target_text     TEXT NOT NULL,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cards_lang_idx ON public.cards(source_lang, target_lang, is_public);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT SELECT ON public.cards TO anon;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public cards readable" ON public.cards FOR SELECT USING (is_public OR auth.uid() = created_by);
CREATE POLICY "Auth insert cards"     ON public.cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates cards" ON public.cards FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator deletes cards" ON public.cards FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.reading_passages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_lang     TEXT NOT NULL,
  target_lang     TEXT NOT NULL,
  title           TEXT NOT NULL,
  source_content  TEXT NOT NULL,
  transliteration TEXT,
  target_content  TEXT NOT NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX passages_lang_idx ON public.reading_passages(source_lang, target_lang, is_public);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_passages TO authenticated;
GRANT SELECT ON public.reading_passages TO anon;
GRANT ALL ON public.reading_passages TO service_role;
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public passages readable" ON public.reading_passages FOR SELECT USING (is_public OR auth.uid() = created_by);
CREATE POLICY "Auth insert passages"     ON public.reading_passages FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates passages" ON public.reading_passages FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator deletes passages" ON public.reading_passages FOR DELETE TO authenticated USING (auth.uid() = created_by);

INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','es','hello',NULL,'hola',true),
('en','es','thank you',NULL,'gracias',true),
('en','es','goodbye',NULL,'adiós',true),
('en','es','please',NULL,'por favor',true),
('en','es','yes',NULL,'sí',true),
('en','es','no',NULL,'no',true),
('en','es','water',NULL,'agua',true),
('en','es','good morning',NULL,'buenos días',true),
('en','es','how are you?',NULL,'¿cómo estás?',true),
('en','es','I love you',NULL,'te quiero',true),
('en','es','friend',NULL,'amigo / amiga',true),
('en','es','book',NULL,'libro',true),
('en','es','house',NULL,'casa',true),
('en','es','I do not understand',NULL,'no entiendo',true),
('en','es','where is the bathroom?',NULL,'¿dónde está el baño?',true),
('en','fr','hello',NULL,'bonjour',true),
('en','fr','thank you',NULL,'merci',true),
('en','fr','goodbye',NULL,'au revoir',true),
('en','fr','please',NULL,'s''il vous plaît',true),
('en','fr','yes',NULL,'oui',true),
('en','fr','no',NULL,'non',true),
('en','fr','water',NULL,'eau',true),
('en','fr','good morning',NULL,'bonjour',true),
('en','fr','how are you?',NULL,'comment allez-vous ?',true),
('en','fr','I love you',NULL,'je t''aime',true),
('en','fr','friend',NULL,'ami / amie',true),
('en','fr','book',NULL,'livre',true),
('en','fr','house',NULL,'maison',true),
('en','fr','I do not understand',NULL,'je ne comprends pas',true),
('en','fr','where is the bathroom?',NULL,'où sont les toilettes ?',true),
('en','de','hello',NULL,'hallo',true),
('en','de','thank you',NULL,'danke',true),
('en','de','goodbye',NULL,'auf Wiedersehen',true),
('en','de','please',NULL,'bitte',true),
('en','de','yes',NULL,'ja',true),
('en','de','no',NULL,'nein',true),
('en','de','water',NULL,'Wasser',true),
('en','de','good morning',NULL,'guten Morgen',true),
('en','de','how are you?',NULL,'wie geht es Ihnen?',true),
('en','de','I love you',NULL,'ich liebe dich',true),
('en','de','friend',NULL,'Freund / Freundin',true),
('en','de','book',NULL,'Buch',true),
('en','de','house',NULL,'Haus',true),
('en','de','I do not understand',NULL,'ich verstehe nicht',true),
('en','de','where is the bathroom?',NULL,'wo ist die Toilette?',true),
('en','ja','hello','Konnichiwa','こんにちは',true),
('en','ja','thank you','Arigatou gozaimasu','ありがとうございます',true),
('en','ja','goodbye','Sayonara','さようなら',true),
('en','ja','please','Onegaishimasu','おねがいします',true),
('en','ja','yes','Hai','はい',true),
('en','ja','no','Iie','いいえ',true),
('en','ja','water','Mizu','水',true),
('en','ja','good morning','Ohayou gozaimasu','おはようございます',true),
('en','ja','how are you?','Ogenki desu ka?','お元気ですか？',true),
('en','ja','I love you','Aishiteru','愛してる',true),
('en','ja','friend','Tomodachi','友達',true),
('en','ja','book','Hon','本',true),
('en','ja','house','Ie','家',true),
('en','ja','I do not understand','Wakarimasen','わかりません',true),
('en','ja','where is the bathroom?','Toire wa doko desu ka?','トイレはどこですか？',true),
('en','ko','hello','Annyeonghaseyo','안녕하세요',true),
('en','ko','thank you','Gamsahamnida','감사합니다',true),
('en','ko','goodbye','Annyeonghi gyeseyo','안녕히 계세요',true),
('en','ko','please','Juseyo','주세요',true),
('en','ko','yes','Ne','네',true),
('en','ko','no','Aniyo','아니요',true),
('en','ko','water','Mul','물',true),
('en','ko','good morning','Joeun achim','좋은 아침',true),
('en','ko','how are you?','Eotteoke jinaeseyo?','어떻게 지내세요?',true),
('en','ko','I love you','Saranghae','사랑해',true),
('en','ko','friend','Chingu','친구',true),
('en','ko','book','Chaek','책',true),
('en','ko','house','Jip','집',true),
('en','ko','I do not understand','Moreugesseumnida','모르겠습니다',true),
('en','ko','where is the bathroom?','Hwajangsil eodi isseoyo?','화장실 어디 있어요?',true),
('en','ar','hello','Marhaban','مرحبا',true),
('en','ar','thank you','Shukran','شكرا',true),
('en','ar','goodbye','Ma''a salama','مع السلامة',true),
('en','ar','please','Min fadlak','من فضلك',true),
('en','ar','yes','Na''am','نعم',true),
('en','ar','no','La','لا',true),
('en','ar','water','Ma''a','ماء',true),
('en','ar','good morning','Sabah al-khayr','صباح الخير',true),
('en','ar','how are you?','Kayfa halak?','كيف حالك؟',true),
('en','ar','I love you','Uhibbuk','أحبك',true),
('en','ar','friend','Sadiq','صديق',true),
('en','ar','book','Kitab','كتاب',true),
('en','ar','house','Bayt','بيت',true),
('en','ar','I do not understand','La afham','لا أفهم',true),
('en','ar','where is the bathroom?','Ayna al-hammam?','أين الحمام؟',true),
('en','pt','hello',NULL,'olá',true),
('en','pt','thank you',NULL,'obrigado / obrigada',true),
('en','pt','goodbye',NULL,'adeus',true),
('en','pt','please',NULL,'por favor',true),
('en','pt','yes',NULL,'sim',true),
('en','pt','no',NULL,'não',true),
('en','pt','water',NULL,'água',true),
('en','pt','good morning',NULL,'bom dia',true),
('en','pt','how are you?',NULL,'como vai você?',true),
('en','pt','I love you',NULL,'eu te amo',true),
('en','pt','friend',NULL,'amigo / amiga',true),
('en','pt','book',NULL,'livro',true),
('en','pt','house',NULL,'casa',true),
('en','pt','I do not understand',NULL,'não entendo',true),
('en','pt','where is the bathroom?',NULL,'onde fica o banheiro?',true),
('en','it','hello',NULL,'ciao',true),
('en','it','thank you',NULL,'grazie',true),
('en','it','goodbye',NULL,'arrivederci',true),
('en','it','please',NULL,'per favore',true),
('en','it','yes',NULL,'sì',true),
('en','it','no',NULL,'no',true),
('en','it','water',NULL,'acqua',true),
('en','it','good morning',NULL,'buongiorno',true),
('en','it','how are you?',NULL,'come stai?',true),
('en','it','I love you',NULL,'ti amo',true),
('en','it','friend',NULL,'amico / amica',true),
('en','it','book',NULL,'libro',true),
('en','it','house',NULL,'casa',true),
('en','it','I do not understand',NULL,'non capisco',true),
('en','it','where is the bathroom?',NULL,'dov''è il bagno?',true),
('en','ru','hello','Privet','Привет',true),
('en','ru','thank you','Spasibo','Спасибо',true),
('en','ru','goodbye','Do svidaniya','До свидания',true),
('en','ru','please','Pozhaluysta','Пожалуйста',true),
('en','ru','yes','Da','Да',true),
('en','ru','no','Net','Нет',true),
('en','ru','water','Voda','Вода',true),
('en','ru','good morning','Dobroe utro','Доброе утро',true),
('en','ru','how are you?','Kak dela?','Как дела?',true),
('en','ru','I love you','Ya tebya lyublyu','Я тебя люблю',true),
('en','ru','friend','Drug','Друг',true),
('en','ru','book','Kniga','Книга',true),
('en','ru','house','Dom','Дом',true),
('en','ru','I do not understand','Ya ne ponimayu','Я не понимаю',true),
('en','ru','where is the bathroom?','Gde tualet?','Где туалет?',true),
('en','hi','hello','Namaste','नमस्ते',true),
('en','hi','thank you','Shukriya','शुक्रिया',true),
('en','hi','goodbye','Alvida','अलविदा',true),
('en','hi','please','Kripaya','कृपया',true),
('en','hi','yes','Haan','हाँ',true),
('en','hi','no','Nahin','नहीं',true),
('en','hi','water','Paani','पानी',true),
('en','hi','good morning','Suprabhat','सुप्रभात',true),
('en','hi','how are you?','Aap kaise hain?','आप कैसे हैं?',true),
('en','hi','I love you','Main tumse pyar karta hoon','मैं तुमसे प्यार करता हूँ',true),
('en','hi','friend','Dost','दोस्त',true),
('en','hi','book','Kitaab','किताब',true),
('en','hi','house','Ghar','घर',true),
('en','hi','I do not understand','Mujhe samajh nahi aaya','मुझे समझ नहीं आया',true),
('en','hi','where is the bathroom?','Bathroom kahaan hai?','बाथरूम कहाँ है?',true),
('en','tr','hello',NULL,'merhaba',true),
('en','tr','thank you',NULL,'teşekkür ederim',true),
('en','tr','goodbye',NULL,'güle güle',true),
('en','tr','please',NULL,'lütfen',true),
('en','tr','yes',NULL,'evet',true),
('en','tr','no',NULL,'hayır',true),
('en','tr','water',NULL,'su',true),
('en','tr','good morning',NULL,'günaydın',true),
('en','tr','how are you?',NULL,'nasılsınız?',true),
('en','tr','I love you',NULL,'seni seviyorum',true),
('en','tr','friend',NULL,'arkadaş',true),
('en','tr','book',NULL,'kitap',true),
('en','tr','house',NULL,'ev',true),
('en','tr','I do not understand',NULL,'anlamıyorum',true),
('en','tr','where is the bathroom?',NULL,'tuvalet nerede?',true),
('en','nl','hello',NULL,'hallo',true),
('en','nl','thank you',NULL,'dank je wel',true),
('en','nl','goodbye',NULL,'tot ziens',true),
('en','nl','please',NULL,'alsjeblieft',true),
('en','nl','yes',NULL,'ja',true),
('en','nl','no',NULL,'nee',true),
('en','nl','water',NULL,'water',true),
('en','nl','good morning',NULL,'goedemorgen',true),
('en','nl','how are you?',NULL,'hoe gaat het?',true),
('en','nl','I love you',NULL,'ik hou van jou',true),
('en','nl','friend',NULL,'vriend / vriendin',true),
('en','nl','book',NULL,'boek',true),
('en','nl','house',NULL,'huis',true),
('en','nl','I do not understand',NULL,'ik begrijp het niet',true),
('en','nl','where is the bathroom?',NULL,'waar is de wc?',true);

INSERT INTO public.reading_passages (source_lang, target_lang, title, source_content, transliteration, target_content, is_public) VALUES
('en','es','Mi familia — My family','Me llamo Ana. Tengo una familia pequeña. Mi madre se llama María y mi padre se llama Carlos. Tengo un hermano que se llama Luis. Vivimos en una casa cerca del parque.',NULL,'My name is Ana. I have a small family. My mother''s name is María and my father''s name is Carlos. I have a brother named Luis. We live in a house near the park.',true),
('en','fr','La ville — The city','Paris est une grande ville. Il y a beaucoup de monuments célèbres, comme la tour Eiffel et le Louvre. Les gens aiment se promener le long de la Seine.',NULL,'Paris is a big city. There are many famous monuments, like the Eiffel Tower and the Louvre. People enjoy walking along the Seine.',true),
('en','ja','学校 — School','わたしは がくせい です。まいにち がっこう へ いきます。がっこう で にほんご を べんきょう します。','Watashi wa gakusei desu. Mainichi gakkou e ikimasu. Gakkou de nihongo wo benkyou shimasu.','I am a student. I go to school every day. I study Japanese at school.',true);
