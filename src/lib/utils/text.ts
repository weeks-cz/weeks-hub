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

/** Obsahuje `text` hledaný výraz? Ignoruje diakritiku i velikost písmen. */
export function obsahuje(text: string | null | undefined, vyraz: string): boolean {
  if (!text) return false;
  return bezDiakritiky(text).includes(bezDiakritiky(vyraz));
}
