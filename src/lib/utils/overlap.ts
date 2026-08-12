/**
 * Rozvržení překrývajících se událostí do sloupců, jako to dělá Google nebo
 * Apple kalendář.
 *
 * Šířka nemůže vycházet z jedné dvojice. Šířku určuje celý souvislý shluk
 * překryvů, ne jen ta událost, se kterou se zrovna kříží: kdyby si každá
 * počítala šířku sama, vyšla by u jedné plná a u sousední poloviční a
 * nesedly by na sebe. Proto se nejdřív najdou shluky a teprve uvnitř nich
 * se přidělují sloupce, které celý shluk sdílí.
 *
 * Sloupce se recyklují. Když A skončí v 10:00 a C začne v 10:15, sednou si
 * do stejného sloupce i v případě, že obě překrývají B — počet sloupců tedy
 * odpovídá nejvyššímu počtu souběžných událostí, ne délce řetězu.
 */

export interface Interval {
  /** minuty od půlnoci */
  od: number;
  /** minuty od půlnoci, výlučně */
  do: number;
}

export interface Rozvrzeni {
  /** index sloupce, od nuly */
  sloupec: number;
  /** kolik sloupců má shluk celkem */
  sloupcu: number;
}

export function rozvrhniPrekryvy<T extends Interval>(polozky: T[]): Map<T, Rozvrzeni> {
  const vysledek = new Map<T, Rozvrzeni>();
  if (polozky.length === 0) return vysledek;

  const serazene = [...polozky].sort((a, b) => a.od - b.od || a.do - b.do);

  let shluk: T[] = [];
  let konecShluku = -Infinity;

  const uzavriShluk = () => {
    if (shluk.length === 0) return;

    // Uvnitř shluku: každá položka jde do prvního sloupce, který je v její
    // době volný. Sloupec drží čas konce své poslední položky.
    const konceSloupcu: number[] = [];
    const prirazeni = new Map<T, number>();

    for (const p of shluk) {
      let index = konceSloupcu.findIndex((konec) => konec <= p.od);
      if (index === -1) {
        konceSloupcu.push(p.do);
        index = konceSloupcu.length - 1;
      } else {
        konceSloupcu[index] = p.do;
      }
      prirazeni.set(p, index);
    }

    for (const p of shluk) {
      vysledek.set(p, { sloupec: prirazeni.get(p) ?? 0, sloupcu: konceSloupcu.length });
    }

    shluk = [];
    konecShluku = -Infinity;
  };

  for (const p of serazene) {
    // Nová položka začíná až po konci celého dosavadního shluku → shluk končí.
    if (p.od >= konecShluku) uzavriShluk();
    shluk.push(p);
    konecShluku = Math.max(konecShluku, p.do);
  }
  uzavriShluk();

  return vysledek;
}
