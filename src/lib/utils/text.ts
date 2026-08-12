/**
 * Porovnávání textu bez ohledu na diakritiku a velikost písmen.
 *
 * V češtině je to u hledání zásadní: kdo píše rychle, napíše „ucebna" nebo
 * „stepan" a čeká, že to najde „učebna" a „Štěpán". Bez složení diakritiky
 * by hledání fungovalo jen tomu, kdo trefí háčky přesně.
 */
export function bezDiakritiky(text: string): string {
  return text
    .normalize('NFD')
    // Kombinující diakritická znaménka, která NFD oddělí od písmen.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Obsahuje `text` hledaný výraz? Ignoruje diakritiku, velikost písmen
 * i pořadí slov — každé napsané slovo se musí v textu vyskytnout.
 *
 * Pořadí slov je důležitější, než se zdá: „dohoda stepan" má najít
 * „Task 2: Dohoda se Štěpánem", i když ta slova nejdou po sobě. Stejný
 * přístup používá i vyhledávání v sekci Děti, odkud je převzatý.
 */
export function obsahuje(text: string | null | undefined, vyraz: string): boolean {
  if (!text) return false;
  const slova = bezDiakritiky(vyraz).split(/\s+/).filter(Boolean);
  if (slova.length === 0) return true;
  const cil = bezDiakritiky(text);
  return slova.every((slovo) => cil.includes(slovo));
}
