-- ============================================================
-- Multilanguage cards & reading passages
-- Generalises the Chinese-specific words/sentences/texts tables
-- ============================================================

-- Update item_kind enum to include the two new kinds
ALTER TYPE public.item_kind ADD VALUE IF NOT EXISTS 'card';
ALTER TYPE public.item_kind ADD VALUE IF NOT EXISTS 'passage';

-- ── cards ────────────────────────────────────────────────────
-- Each card belongs to a language pair (source → target).
-- transliteration is optional (Pinyin, Romaji, etc.)
CREATE TABLE public.cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_lang     TEXT NOT NULL,          -- ISO 639-1 code, e.g. 'en'
  target_lang     TEXT NOT NULL,          -- ISO 639-1 code, e.g. 'fr'
  source_text     TEXT NOT NULL,
  transliteration TEXT,                   -- NULL for languages that don't need it
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

-- ── reading_passages ─────────────────────────────────────────
-- Multilang equivalent of the existing 'texts' table.
CREATE TABLE public.reading_passages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_lang     TEXT NOT NULL,
  target_lang     TEXT NOT NULL,
  title           TEXT NOT NULL,
  source_content  TEXT NOT NULL,          -- content in target language (the one being learned)
  transliteration TEXT,                   -- optional romanisation
  target_content  TEXT NOT NULL,          -- translation in source language
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

-- ============================================================
-- SEED DATA — public cards for each language pair
-- ============================================================

-- ── English → Spanish ───────────────────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','es','hello',NULL,'hola'),
('en','es','thank you',NULL,'gracias'),
('en','es','goodbye',NULL,'adiós'),
('en','es','please',NULL,'por favor'),
('en','es','yes',NULL,'sí'),
('en','es','no',NULL,'no'),
('en','es','water',NULL,'agua'),
('en','es','good morning',NULL,'buenos días'),
('en','es','how are you?',NULL,'¿cómo estás?'),
('en','es','I love you',NULL,'te quiero'),
('en','es','friend',NULL,'amigo / amiga'),
('en','es','book',NULL,'libro'),
('en','es','house',NULL,'casa'),
('en','es','I do not understand',NULL,'no entiendo'),
('en','es','where is the bathroom?',NULL,'¿dónde está el baño?');

-- ── English → French ────────────────────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','fr','hello',NULL,'bonjour'),
('en','fr','thank you',NULL,'merci'),
('en','fr','goodbye',NULL,'au revoir'),
('en','fr','please',NULL,'s''il vous plaît'),
('en','fr','yes',NULL,'oui'),
('en','fr','no',NULL,'non'),
('en','fr','water',NULL,'eau'),
('en','fr','good morning',NULL,'bonjour'),
('en','fr','how are you?',NULL,'comment allez-vous ?'),
('en','fr','I love you',NULL,'je t''aime'),
('en','fr','friend',NULL,'ami / amie'),
('en','fr','book',NULL,'livre'),
('en','fr','house',NULL,'maison'),
('en','fr','I do not understand',NULL,'je ne comprends pas'),
('en','fr','where is the bathroom?',NULL,'où sont les toilettes ?');

-- ── English → German ────────────────────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','de','hello',NULL,'hallo'),
('en','de','thank you',NULL,'danke'),
('en','de','goodbye',NULL,'auf Wiedersehen'),
('en','de','please',NULL,'bitte'),
('en','de','yes',NULL,'ja'),
('en','de','no',NULL,'nein'),
('en','de','water',NULL,'Wasser'),
('en','de','good morning',NULL,'guten Morgen'),
('en','de','how are you?',NULL,'wie geht es Ihnen?'),
('en','de','I love you',NULL,'ich liebe dich'),
('en','de','friend',NULL,'Freund / Freundin'),
('en','de','book',NULL,'Buch'),
('en','de','house',NULL,'Haus'),
('en','de','I do not understand',NULL,'ich verstehe nicht'),
('en','de','where is the bathroom?',NULL,'wo ist die Toilette?');

-- ── English → Japanese (with romaji) ────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','ja','hello','Konnichiwa','こんにちは'),
('en','ja','thank you','Arigatou gozaimasu','ありがとうございます'),
('en','ja','goodbye','Sayonara','さようなら'),
('en','ja','please','Onegaishimasu','おねがいします'),
('en','ja','yes','Hai','はい'),
('en','ja','no','Iie','いいえ'),
('en','ja','water','Mizu','水'),
('en','ja','good morning','Ohayou gozaimasu','おはようございます'),
('en','ja','how are you?','Ogenki desu ka?','お元気ですか？'),
('en','ja','I love you','Aishiteru','愛してる'),
('en','ja','friend','Tomodachi','友達'),
('en','ja','book','Hon','本'),
('en','ja','house','Ie','家'),
('en','ja','I do not understand','Wakarimasen','わかりません'),
('en','ja','where is the bathroom?','Toire wa doko desu ka?','トイレはどこですか？');

-- ── English → Korean (with romanisation) ─────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','ko','hello','Annyeonghaseyo','안녕하세요'),
('en','ko','thank you','Gamsahamnida','감사합니다'),
('en','ko','goodbye','Annyeonghi gyeseyo','안녕히 계세요'),
('en','ko','please','Juseyo','주세요'),
('en','ko','yes','Ne','네'),
('en','ko','no','Aniyo','아니요'),
('en','ko','water','Mul','물'),
('en','ko','good morning','Joeun achim','좋은 아침'),
('en','ko','how are you?','Eotteoke jinaeseyo?','어떻게 지내세요?'),
('en','ko','I love you','Saranghae','사랑해'),
('en','ko','friend','Chingu','친구'),
('en','ko','book','Chaek','책'),
('en','ko','house','Jip','집'),
('en','ko','I do not understand','Moreugesseumnida','모르겠습니다'),
('en','ko','where is the bathroom?','Hwajangsil eodi isseoyo?','화장실 어디 있어요?');

-- ── English → Arabic (with romanisation) ─────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','ar','hello','Marhaban','مرحبا'),
('en','ar','thank you','Shukran','شكرا'),
('en','ar','goodbye','Ma''a salama','مع السلامة'),
('en','ar','please','Min fadlak','من فضلك'),
('en','ar','yes','Na''am','نعم'),
('en','ar','no','La','لا'),
('en','ar','water','Ma''a','ماء'),
('en','ar','good morning','Sabah al-khayr','صباح الخير'),
('en','ar','how are you?','Kayfa halak?','كيف حالك؟'),
('en','ar','I love you','Uhibbuk','أحبك'),
('en','ar','friend','Sadiq','صديق'),
('en','ar','book','Kitab','كتاب'),
('en','ar','house','Bayt','بيت'),
('en','ar','I do not understand','La afham','لا أفهم'),
('en','ar','where is the bathroom?','Ayna al-hammam?','أين الحمام؟');

-- ── English → Portuguese ─────────────────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','pt','hello',NULL,'olá'),
('en','pt','thank you',NULL,'obrigado / obrigada'),
('en','pt','goodbye',NULL,'adeus'),
('en','pt','please',NULL,'por favor'),
('en','pt','yes',NULL,'sim'),
('en','pt','no',NULL,'não'),
('en','pt','water',NULL,'água'),
('en','pt','good morning',NULL,'bom dia'),
('en','pt','how are you?',NULL,'como vai você?'),
('en','pt','I love you',NULL,'eu te amo'),
('en','pt','friend',NULL,'amigo / amiga'),
('en','pt','book',NULL,'livro'),
('en','pt','house',NULL,'casa'),
('en','pt','I do not understand',NULL,'não entendo'),
('en','pt','where is the bathroom?',NULL,'onde fica o banheiro?');

-- ── English → Italian ────────────────────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','it','hello',NULL,'ciao'),
('en','it','thank you',NULL,'grazie'),
('en','it','goodbye',NULL,'arrivederci'),
('en','it','please',NULL,'per favore'),
('en','it','yes',NULL,'sì'),
('en','it','no',NULL,'no'),
('en','it','water',NULL,'acqua'),
('en','it','good morning',NULL,'buongiorno'),
('en','it','how are you?',NULL,'come stai?'),
('en','it','I love you',NULL,'ti amo'),
('en','it','friend',NULL,'amico / amica'),
('en','it','book',NULL,'libro'),
('en','it','house',NULL,'casa'),
('en','it','I do not understand',NULL,'non capisco'),
('en','it','where is the bathroom?',NULL,'dov''è il bagno?');

-- ── English → Russian (with romanisation) ────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','ru','hello','Privet','Привет'),
('en','ru','thank you','Spasibo','Спасибо'),
('en','ru','goodbye','Do svidaniya','До свидания'),
('en','ru','please','Pozhaluysta','Пожалуйста'),
('en','ru','yes','Da','Да'),
('en','ru','no','Net','Нет'),
('en','ru','water','Voda','Вода'),
('en','ru','good morning','Dobroe utro','Доброе утро'),
('en','ru','how are you?','Kak dela?','Как дела?'),
('en','ru','I love you','Ya tebya lyublyu','Я тебя люблю'),
('en','ru','friend','Drug','Друг'),
('en','ru','book','Kniga','Книга'),
('en','ru','house','Dom','Дом'),
('en','ru','I do not understand','Ya ne ponimayu','Я не понимаю'),
('en','ru','where is the bathroom?','Gde tualet?','Где туалет?');

-- ── English → Hindi (with romanisation) ─────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','hi','hello','Namaste','नमस्ते'),
('en','hi','thank you','Shukriya','शुक्रिया'),
('en','hi','goodbye','Alvida','अलविदा'),
('en','hi','please','Kripaya','कृपया'),
('en','hi','yes','Haan','हाँ'),
('en','hi','no','Nahin','नहीं'),
('en','hi','water','Paani','पानी'),
('en','hi','good morning','Suprabhat','सुप्रभात'),
('en','hi','how are you?','Aap kaise hain?','आप कैसे हैं?'),
('en','hi','I love you','Main tumse pyar karta hoon','मैं तुमसे प्यार करता हूँ'),
('en','hi','friend','Dost','दोस्त'),
('en','hi','book','Kitaab','किताब'),
('en','hi','house','Ghar','घर'),
('en','hi','I do not understand','Mujhe samajh nahi aaya','मुझे समझ नहीं आया'),
('en','hi','where is the bathroom?','Bathroom kahaan hai?','बाथरूम कहाँ है?');

-- ── English → Turkish ────────────────────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','tr','hello',NULL,'merhaba'),
('en','tr','thank you',NULL,'teşekkür ederim'),
('en','tr','goodbye',NULL,'güle güle'),
('en','tr','please',NULL,'lütfen'),
('en','tr','yes',NULL,'evet'),
('en','tr','no',NULL,'hayır'),
('en','tr','water',NULL,'su'),
('en','tr','good morning',NULL,'günaydın'),
('en','tr','how are you?',NULL,'nasılsınız?'),
('en','tr','I love you',NULL,'seni seviyorum'),
('en','tr','friend',NULL,'arkadaş'),
('en','tr','book',NULL,'kitap'),
('en','tr','house',NULL,'ev'),
('en','tr','I do not understand',NULL,'anlamıyorum'),
('en','tr','where is the bathroom?',NULL,'tuvalet nerede?');

-- ── English → Dutch ──────────────────────────────────────────
INSERT INTO public.cards (source_lang, target_lang, source_text, transliteration, target_text, is_public) VALUES
('en','nl','hello',NULL,'hallo'),
('en','nl','thank you',NULL,'dank je wel'),
('en','nl','goodbye',NULL,'tot ziens'),
('en','nl','please',NULL,'alsjeblieft'),
('en','nl','yes',NULL,'ja'),
('en','nl','no',NULL,'nee'),
('en','nl','water',NULL,'water'),
('en','nl','good morning',NULL,'goedemorgen'),
('en','nl','how are you?',NULL,'hoe gaat het?'),
('en','nl','I love you',NULL,'ik hou van jou'),
('en','nl','friend',NULL,'vriend / vriendin'),
('en','nl','book',NULL,'boek'),
('en','nl','house',NULL,'huis'),
('en','nl','I do not understand',NULL,'ik begrijp het niet'),
('en','nl','where is the bathroom?',NULL,'waar is de wc?');

-- ── Reading passage: English → Spanish ──────────────────────
INSERT INTO public.reading_passages (source_lang, target_lang, title, source_content, transliteration, target_content, is_public) VALUES
('en','es',
 'Mi familia — My family',
 'Me llamo Ana. Tengo una familia pequeña. Mi madre se llama María y mi padre se llama Carlos. Tengo un hermano que se llama Luis. Vivimos en una casa cerca del parque.',
 NULL,
 'My name is Ana. I have a small family. My mother''s name is María and my father''s name is Carlos. I have a brother named Luis. We live in a house near the park.');

-- ── Reading passage: English → French ───────────────────────
INSERT INTO public.reading_passages (source_lang, target_lang, title, source_content, transliteration, target_content, is_public) VALUES
('en','fr',
 'La ville — The city',
 'Paris est une grande ville. Il y a beaucoup de monuments célèbres, comme la tour Eiffel et le Louvre. Les gens aiment se promener le long de la Seine.',
 NULL,
 'Paris is a big city. There are many famous monuments, like the Eiffel Tower and the Louvre. People enjoy walking along the Seine.');

-- ── Reading passage: English → Japanese ─────────────────────
INSERT INTO public.reading_passages (source_lang, target_lang, title, source_content, transliteration, target_content, is_public) VALUES
('en','ja',
 '学校 — School',
 'わたしは がくせい です。まいにち がっこう へ いきます。がっこう で にほんご を べんきょう します。',
 'Watashi wa gakusei desu. Mainichi gakkou e ikimasu. Gakkou de nihongo wo benkyou shimasu.',
 'I am a student. I go to school every day. I study Japanese at school.');
