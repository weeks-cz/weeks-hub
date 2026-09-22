-- ===== 014: form_type pro poptávky z /firmy a /oslavy =====
--
-- Web posílá do `/api/form-submissions` hodnotu `form_type`, kterou odvodí
-- z formuláře. Firemní poptávky (`firmy`) posílá od fáze 4, jenže hub tu
-- hodnotu nikdy nepřijal — whitelist v routě i CHECK constraint znaly jen
-- `waitlist`, `contact` a `shop_interest`. Poptávky se proto do evidence
-- nedostaly: skončily čtyřstovkou, kterou si web jen zaloguje.
--
-- Data se tím neztratila. Web posílá poptávku nejdřív do Formspree a teprve
-- potom sem, takže e-mail na admin@weeks.cz dorazil vždycky. Chyběl jen
-- záznam v hubu — a nikdo si toho nevšiml, protože odesílatel dostal
-- potvrzení tak jako tak.
--
-- Tahle migrace přidává `firmy` i `oslavy` (nová stránka /oslavy) a sloupce
-- na pole, která web u těchhle poptávek posílá navíc.

ALTER TABLE form_submissions
  DROP CONSTRAINT IF EXISTS form_submissions_form_type_check;

ALTER TABLE form_submissions
  ADD CONSTRAINT form_submissions_form_type_check
  CHECK (form_type IN ('waitlist', 'contact', 'shop_interest', 'firmy', 'oslavy'));

-- `company` a `phone` chodí z firemní poptávky, `inquiry_type` nese id nabídky
-- (`deti-zamestnancu`, `workshopy`, `partnerstvi`) nebo `oslava`. Pojmenované
-- anglicky jako zbytek tabulky, přestože web je posílá česky — mapování dělá
-- routa, ať se sloupce nerozejdou se zbytkem schématu.
ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS inquiry_type TEXT;
