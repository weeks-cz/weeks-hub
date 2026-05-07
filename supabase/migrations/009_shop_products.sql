-- ===== 009: Shop products =====
-- Products managed in Weeks Hub and displayed on weeks.cz/eshop.

CREATE TABLE IF NOT EXISTS shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('set', 'upgrade-kit', 'project')),

  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  age_range TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  lead_time TEXT NOT NULL DEFAULT 'Sbíráme zájem',

  image_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',

  includes TEXT[] NOT NULL DEFAULT '{}',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  ideal_for TEXT[] NOT NULL DEFAULT '{}',
  projects TEXT[] NOT NULL DEFAULT '{}',

  badge TEXT NOT NULL DEFAULT '',
  category_label TEXT NOT NULL DEFAULT '',
  unlocks TEXT NOT NULL DEFAULT '',
  compatibility TEXT,

  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_products_published ON shop_products(published);
CREATE INDEX IF NOT EXISTS idx_shop_products_type ON shop_products(type);
CREATE INDEX IF NOT EXISTS idx_shop_products_sort_order ON shop_products(sort_order);
CREATE INDEX IF NOT EXISTS idx_shop_products_slug ON shop_products(slug);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_shop_products_updated_at'
  ) THEN
    CREATE TRIGGER update_shop_products_updated_at
      BEFORE UPDATE ON shop_products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shop_products' AND policyname = 'Weeks users can view shop products'
  ) THEN
    CREATE POLICY "Weeks users can view shop products"
      ON shop_products FOR SELECT
      USING (is_weeks_user());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shop_products' AND policyname = 'Weeks users can create shop products'
  ) THEN
    CREATE POLICY "Weeks users can create shop products"
      ON shop_products FOR INSERT
      WITH CHECK (is_weeks_user());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shop_products' AND policyname = 'Weeks users can update shop products'
  ) THEN
    CREATE POLICY "Weeks users can update shop products"
      ON shop_products FOR UPDATE
      USING (is_weeks_user());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shop_products' AND policyname = 'Weeks users can delete shop products'
  ) THEN
    CREATE POLICY "Weeks users can delete shop products"
      ON shop_products FOR DELETE
      USING (is_weeks_user());
  END IF;
END $$;

-- Product interests are stored in the same inbox as other web forms.
ALTER TABLE form_submissions
  DROP CONSTRAINT IF EXISTS form_submissions_form_type_check;

ALTER TABLE form_submissions
  ADD CONSTRAINT form_submissions_form_type_check
  CHECK (form_type IN ('waitlist', 'contact', 'shop_interest'));

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS product_slug TEXT,
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS product_type TEXT;

-- Public product image bucket. Anyone can read, Weeks users can manage files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-product-images', 'shop-product-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public shop product image read'
  ) THEN
    CREATE POLICY "Public shop product image read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'shop-product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Weeks users can upload shop product images'
  ) THEN
    CREATE POLICY "Weeks users can upload shop product images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'shop-product-images' AND is_weeks_user());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Weeks users can update shop product images'
  ) THEN
    CREATE POLICY "Weeks users can update shop product images"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'shop-product-images' AND is_weeks_user());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Weeks users can delete shop product images'
  ) THEN
    CREATE POLICY "Weeks users can delete shop product images"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'shop-product-images' AND is_weeks_user());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shop_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_products;
  END IF;
END $$;

-- Initial editable product catalog copied from the current weeks.cz e-shop draft.
INSERT INTO shop_products (
  slug, name, subtitle, type, price, age_range, level, lead_time, image_url,
  description, long_description, includes, highlights, ideal_for, projects,
  badge, category_label, unlocks, compatibility, published, sort_order
) VALUES
(
  'iot-starter-kit',
  'Weeks Starter sada',
  'První chytré zapojení doma',
  'set',
  1490,
  '10-14 let',
  'Začátečník',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-arduino-breadboard.jpg',
  'Základní sada chytré elektroniky pro první lekce ve Weeks Učebně a bezpečný domácí start.',
  'Weeks Starter sada je vstupenka do chytré elektroniky bez shánění náhodných součástek. Dítě dostane řídicí desku, nepájivé pole, kabely a základní senzory, aby mohlo ve Weeks Učebně projít prvními projekty od LEDek přes tlačítka až po jednoduchá měření.',
  ARRAY['Arduino kompatibilní deska s USB kabelem', 'Nepájivé pole a sada propojovacích kabelů', 'LED diody, RGB LED, odpory a tlačítka', 'Bzučák, fotorezistor, potenciometr a jednoduchý teplotní senzor', 'Servo motor pro první pohyblivé projekty', 'Přístup do Weeks Učebny k projektům pro Starter sadu'],
  ARRAY['Obsahuje základní elektroniku, kterou další sady už znovu nekopírují', 'Vhodná i bez předchozí zkušenosti s programováním', 'Připraví dítě na navazující Home Lab a Explorer kity'],
  ARRAY['Děti, které chtějí začít stavět podle vedených projektů', 'Rodiče, kteří chtějí technický dárek s jasným postupem', 'Domácí pokračování po prvním setkání s Weeks'],
  ARRAY['Semafor s tlačítkem', 'Noční světlo se senzorem', 'Reakční hra s LEDkami', 'Mini trezor s bzučákem'],
  'Nejlepší start',
  'Celá sada',
  'Odemkne základní Starter část Weeks Učebny.',
  NULL,
  true,
  10
),
(
  'smart-home-lab',
  'Weeks Home Lab',
  'Chytrá domácnost na stole',
  'set',
  2290,
  '11-15 let',
  'Mírně pokročilý',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-circuit-design.jpg',
  'Kompletní sada pro domácí chytrá zařízení se senzory, displejem, WiFi deskou a reálnými scénáři.',
  'Weeks Home Lab je celá sada pro děti, které chtějí stavět chytrou domácnost na stole. Obsahuje základní výbavu i specifické komponenty pro měření prostředí, upozornění, jednoduché alarmy a první internetové propojení. Hodí se pro zákazníka, který ještě žádnou Weeks sadu nemá.',
  ARRAY['Vše důležité ze Starter sady: deska, breadboard, kabely, LEDky, odpory a tlačítka', 'ESP deska pro WiFi projekty', 'Senzor teploty a vlhkosti, senzor světla a senzor pohybu', 'I2C OLED displej pro zobrazování hodnot', 'Magnetický kontakt, bzučák a sada pro signalizaci', 'Přístup do Weeks Učebny k Home Lab projektům'],
  ARRAY['Kompletní balení pro zákazníky bez Starter sady', 'Reálné domácí scénáře: měření, alarmy a notifikace', 'Kdo už má Starter sadu, může místo toho zvolit levnější Home Lab kit'],
  ARRAY['Děti, které už někdy zapojovaly jednoduchý obvod', 'Rodiny, které chtějí propojit hraní, tvoření a učení', 'Začátek s IoT bez nutnosti vlastnit předchozí sadu'],
  ARRAY['Domácí meteostanice', 'Chytrý hlídač šuplíku', 'Hlídač potopy', 'Parkovací asistent'],
  'Chytrá domácnost',
  'Celá sada',
  'Odemkne Starter i Home Lab část Weeks Učebny.',
  NULL,
  true,
  20
),
(
  'sensor-explorer-box',
  'Weeks Explorer sada',
  'Experimenty, měření a vlastní nápady',
  'set',
  2890,
  '12-16 let',
  'Pokročilý',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-plant-sensor.jpg',
  'Rozšířená kompletní sada pro IoT projekty s motory, světly, ovladači a větším prostorem pro vlastní prototypy.',
  'Weeks Explorer sada je nejširší balení pro děti, které chtějí za hranici základních zapojení. Spojuje základní výbavu, Home Lab komponenty a rozšíření pro pohyb, světelné efekty, ovládání a delší projekty. Hodí se pro zákazníka, který chce rovnou největší balení.',
  ARRAY['Základní výbava pro zapojování: deska, breadboard, kabely, odpory, LEDky a tlačítka', 'ESP32 deska pro WiFi a Bluetooth projekty', 'Senzory prostředí včetně BME280 a kapacitního senzoru vlhkosti půdy', 'Adresovatelný RGB LED pásek nebo NeoPixel kroužek', 'Rotační enkodér, krokový motor 28BYJ-48 s driverem ULN2003', 'Přístup do Weeks Učebny k Explorer projektům'],
  ARRAY['Největší prostor pro vlastní tvorbu a experimenty', 'Obsahuje komponenty pro světla, ovladače, motory i měření', 'Kdo už má Starter sadu, může navázat levněji přes Explorer kit'],
  ARRAY['Děti, které už vědí, že je chytrá elektronika baví', 'Domácí kutily se zájmem o techniku', 'Absolventy Weeks programu, kteří chtějí pokračovat doma'],
  ARRAY['Květinový záchranář', 'Chytrý notifikátor', 'Chytrý knob', 'Automatizace rolet'],
  'Pro zvídavce',
  'Celá sada',
  'Odemkne Starter, Home Lab i Explorer část Weeks Učebny.',
  NULL,
  true,
  30
),
(
  'home-lab-upgrade-kit',
  'Home Lab kit',
  'Rozšíření pro majitele Starter sady',
  'upgrade-kit',
  890,
  '11-15 let',
  'Navazující',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-circuit-design.jpg',
  'Doplňkový balíček se specifickými Home Lab komponenty bez znovunakupování Arduina, breadboardu a kabelů.',
  'Home Lab kit je určený pro děti, které už mají Weeks Starter sadu. Neposíláme znovu základní výbavu, ale jen komponenty potřebné pro další úroveň: WiFi desku, senzory prostředí, displej a prvky pro domácí alarmy. Ze Starter sady tak vznikne Home Lab.',
  ARRAY['ESP deska pro WiFi projekty', 'Senzor teploty a vlhkosti BME280 nebo DHT22', 'I2C OLED displej 0.96"', 'PIR senzor pohybu a magnetický kontakt', 'Senzor úniku vody a piezo bzučák', 'Odemčení Home Lab projektů ve Weeks Učebně'],
  ARRAY['Levnější cesta pro zákazníky, kteří už mají Starter sadu', 'Bez duplicitních základních součástek', 'Přidá WiFi, displej a domácí senzory'],
  ARRAY['Majitele Weeks Starter sady', 'Děti, které chtějí po základech přejít na chytrou domácnost', 'Rodiče, kteří nechtějí platit podruhé za stejnou základní elektroniku'],
  ARRAY['Domácí meteostanice', 'Chytrý hlídač šuplíku', 'Hlídač potopy', 'Parkovací asistent'],
  'Upgrade bez duplicit',
  'Navazující kit',
  'Rozšíří Starter sadu a odemkne Home Lab část Učebny.',
  'Počítá s tím, že doma už máte Weeks Starter sadu nebo podobnou základní Arduino výbavu.',
  true,
  40
),
(
  'explorer-upgrade-kit',
  'Explorer kit',
  'Rozšíření ze Starter/Home Lab na pokročilé projekty',
  'upgrade-kit',
  1190,
  '12-16 let',
  'Pokročilý',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-plant-sensor.jpg',
  'Doplňkový balíček pro pokročilé projekty se světly, motory, ovladačem a senzory pro vlastní prototypy.',
  'Explorer kit navazuje na Starter nebo Home Lab výbavu. Přidává komponenty, které dávají projektům pohyb, světlo, fyzické ovládání a větší samostatnost. Je to cesta pro zákazníka, který nechce kupovat celou Explorer sadu, protože základní elektroniku už doma má.',
  ARRAY['ESP32 deska pro WiFi a Bluetooth projekty', 'Kapacitní senzor vlhkosti půdy v2.0', 'NeoPixel RGB kroužek nebo krátký adresovatelný LED pásek', 'Rotační enkodér s tlačítkem', 'Krokový motor 28BYJ-48 s driverem ULN2003', 'Odemčení Explorer projektů ve Weeks Učebně'],
  ARRAY['Pokročilé komponenty bez duplicitní základní výbavy', 'Vhodné jako další level po Starter nebo Home Lab sadě', 'Otevírá delší projekty s IoT, světly a pohybem'],
  ARRAY['Majitele Starter nebo Home Lab sady', 'Děti, které chtějí stavět výraznější domácí projekty', 'Pokračování po táboře, kroužku nebo domácím workshopu'],
  ARRAY['Květinový záchranář', 'Chytrý notifikátor', 'Chytrý knob', 'Automatizace rolet'],
  'Další level',
  'Navazující kit',
  'Doplní pokročilé komponenty a odemkne Explorer část Učebny.',
  'Nejlépe funguje se Starter sadou. Pokud už máte Home Lab, část senzorů se využije i v Explorer projektech.',
  true,
  50
),
(
  'kvetinovy-zachranar',
  'Květinový záchranář',
  'Chytrý monitor rostlin',
  'project',
  390,
  '11-15 let',
  'Mírně pokročilý',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-plant-sensor.jpg',
  'Malý projekt, který hlídá vlhkost půdy a upozorní, když rostlina potřebuje zalít.',
  'Květinový záchranář je samostatný projekt pro děti, které chtějí postavit něco praktického. Senzor se zapíchne do hlíny, ESP vyhodnocuje vlhkost a upozorní LEDkou, bzučákem nebo přes WiFi. V Učebně se odemkne jen tento projekt.',
  ARRAY['ESP deska', 'Kapacitní senzor vlhkosti půdy v2.0', 'LED nebo pasivní bzučák', 'Nepájivé pole a propojovací kabely', 'Přístup k jednomu projektu ve Weeks Učebně'],
  ARRAY['Levnější než celá sada', 'Řeší reálný domácí problém', 'Učebna odemkne pouze tento projekt'],
  ARRAY['První samostatný IoT projekt', 'Děti, které mají rády praktické vychytávky', 'Vyzkoušení Weeks Učebny bez nákupu celé sady'],
  ARRAY['Květinový záchranář'],
  'Malý projekt',
  'Samostatný projekt',
  'Odemkne pouze projekt Květinový záchranář.',
  NULL,
  true,
  60
),
(
  'domaci-meteostanice',
  'Domácí meteostanice',
  'Monitor prostředí v pokoji',
  'project',
  490,
  '11-15 let',
  'Mírně pokročilý',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-circuit-design.jpg',
  'Projekt s displejem, který měří teplotu, vlhkost a tlak a může posílat data do grafů.',
  'Domácí meteostanice ukazuje aktuální stav v pokoji na malém OLED displeji. Dítě si vyzkouší práci se senzorem, displejem i odesíláním dat na internetovou službu pro jednoduché grafy. V Učebně se odemkne jen tento projekt.',
  ARRAY['ESP deska', 'BME280 nebo DHT22 senzor', 'I2C OLED displej 0.96"', 'Nepájivé pole a propojovací kabely', 'Přístup k jednomu projektu ve Weeks Učebně'],
  ARRAY['Viditelný výsledek na displeji', 'Dobré propojení elektroniky, programování a dat', 'Učebna odemkne pouze tento projekt'],
  ARRAY['Děti, které baví měření a grafy', 'Noční stolek, pracovní stůl nebo dětský pokoj', 'Praktický projekt na doma'],
  ARRAY['Domácí meteostanice'],
  'Malý projekt',
  'Samostatný projekt',
  'Odemkne pouze projekt Domácí meteostanice.',
  NULL,
  true,
  70
),
(
  'chytry-notifikator',
  'Chytrý notifikátor',
  'RGB lampička podle internetu',
  'project',
  390,
  '12-16 let',
  'Pokročilý',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-arduino-programming.jpg',
  'Designový projekt s RGB světlem, které mění barvu podle počasí, zpráv nebo vlastních pravidel.',
  'Chytrý notifikátor je malá RGB lampička řízená ESP deskou. Dítě ji naprogramuje tak, aby svítila podle počasí, notifikace nebo hodnot z internetu. Projekt je vizuální, dobře se ukazuje a v Učebně se odemkne samostatně.',
  ARRAY['ESP deska', 'NeoPixel RGB kroužek nebo krátký LED pásek', 'Základní difuzor nebo šablona pro stínítko', 'Propojovací kabely', 'Přístup k jednomu projektu ve Weeks Učebně'],
  ARRAY['Atraktivní světelný výsledek', 'Ukazuje propojení internetu a fyzického zařízení', 'Učebna odemkne pouze tento projekt'],
  ARRAY['Děti, které baví světla a vizuální efekty', 'Ukázku na akci nebo domácí stůl', 'První pokročilejší IoT automatizaci'],
  ARRAY['Chytrý notifikátor'],
  'Malý projekt',
  'Samostatný projekt',
  'Odemkne pouze projekt Chytrý notifikátor.',
  NULL,
  true,
  80
),
(
  'parkovaci-asistent',
  'Parkovací asistent',
  'Ultrazvukový semafor do garáže',
  'project',
  350,
  '10-14 let',
  'Začátečník',
  'Sbíráme zájem',
  'https://weeks.cz/images/gallery/iot-arduino-breadboard.jpg',
  'Jednoduchý projekt, který měří vzdálenost a ukazuje zelenou, žlutou nebo červenou.',
  'Parkovací asistent je přehledný projekt na vysvětlení senzorů. Ultrazvuk měří vzdálenost, LEDky ukazují stav a dítě si vyzkouší podmínky v kódu. V Učebně se odemkne jen tento projekt.',
  ARRAY['Arduino kompatibilní nebo ESP deska', 'Ultrazvukový senzor HC-SR04', 'Zelená, žlutá a červená LED dioda', 'Odpory, nepájivé pole a kabely', 'Přístup k jednomu projektu ve Weeks Učebně'],
  ARRAY['Srozumitelný princip měření vzdálenosti', 'Rychle viditelný výsledek', 'Učebna odemkne pouze tento projekt'],
  ARRAY['Začátečníky, kteří už zvládnou LEDky', 'Praktickou ukázku senzorů', 'Krátký domácí projekt'],
  ARRAY['Parkovací asistent'],
  'Malý projekt',
  'Samostatný projekt',
  'Odemkne pouze projekt Parkovací asistent.',
  NULL,
  true,
  90
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  age_range = EXCLUDED.age_range,
  level = EXCLUDED.level,
  lead_time = EXCLUDED.lead_time,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  includes = EXCLUDED.includes,
  highlights = EXCLUDED.highlights,
  ideal_for = EXCLUDED.ideal_for,
  projects = EXCLUDED.projects,
  badge = EXCLUDED.badge,
  category_label = EXCLUDED.category_label,
  unlocks = EXCLUDED.unlocks,
  compatibility = EXCLUDED.compatibility,
  published = EXCLUDED.published,
  sort_order = EXCLUDED.sort_order;
