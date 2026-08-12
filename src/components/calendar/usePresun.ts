'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Práh v pixelech, po jehož překročení se z kliknutí stává přesun. */
const PRAH_PX = 4;

export interface PresouvanaPolozka {
  typ: 'udalost' | 'ukol';
  id: string;
  titul: string;
  /** Celodenní položka nebo úkol — čas se při přesunu nemění, jen datum. */
  celodenni: boolean;
}

export interface CilPresunu {
  /** YYYY-MM-DD z data-den */
  den: string;
  /** Minuty od půlnoci, nebo null když cíl není časová mřížka. */
  minuty: number | null;
}

interface Stav {
  polozka: PresouvanaPolozka;
  x: number;
  y: number;
}

/**
 * Přesouvání položek kalendáře myší i prstem.
 *
 * Cíl se nehledá v registru drop zón, ale přes `elementFromPoint` a atribut
 * `data-den` — díky tomu funguje stejně v měsíční mřížce i v časové ose a
 * nemusí se udržovat seznam zón, který se rozejde s realitou.
 *
 * Časová mřížka navíc nese `data-mrizka` s výškou hodiny v pixelech, takže
 * se z pozice kurzoru dopočítá čas a přichytí na půlhodiny.
 */
export function usePresun(onDrop: (p: PresouvanaPolozka, cil: CilPresunu) => void) {
  const [stav, setStav] = useState<Stav | null>(null);
  // V refu, aby posluchače na window nemusely znovu vznikat při každém pohybu.
  const start = useRef<{ x: number; y: number; polozka: PresouvanaPolozka } | null>(null);
  const aktivni = useRef(false);

  const zacni = useCallback((e: React.PointerEvent, polozka: PresouvanaPolozka) => {
    // Jen levé tlačítko; pravé patří kontextovému menu.
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, polozka };
    aktivni.current = false;
  }, []);

  useEffect(() => {
    const pohyb = (e: PointerEvent) => {
      const s = start.current;
      if (!s) return;

      if (!aktivni.current) {
        const vzdalenost = Math.hypot(e.clientX - s.x, e.clientY - s.y);
        if (vzdalenost < PRAH_PX) return;
        aktivni.current = true;
      }
      // Bez toho by se při tažení označoval text pod kurzorem.
      e.preventDefault();
      setStav({ polozka: s.polozka, x: e.clientX, y: e.clientY });
    };

    const pusteni = (e: PointerEvent) => {
      const s = start.current;
      start.current = null;

      if (!s || !aktivni.current) {
        // Nepřekročil práh — bylo to kliknutí, ať doběhne onClick.
        aktivni.current = false;
        setStav(null);
        return;
      }
      aktivni.current = false;
      setStav(null);

      const pod = document.elementFromPoint(e.clientX, e.clientY);
      const cil = pod?.closest<HTMLElement>('[data-den]');
      if (!cil) return;

      const den = cil.dataset.den;
      if (!den) return;

      let minuty: number | null = null;
      const hodinaPx = Number(cil.dataset.mrizka);
      if (!s.polozka.celodenni && Number.isFinite(hodinaPx) && hodinaPx > 0) {
        const rect = cil.getBoundingClientRect();
        const y = e.clientY - rect.top;
        // Přichycení na půlhodiny; na minutu by to nikdo netrefil.
        minuty = Math.max(0, Math.min(23 * 60 + 30, Math.round((y / hodinaPx) * 2) * 30));
      }

      onDrop(s.polozka, { den, minuty });
    };

    window.addEventListener('pointermove', pohyb, { passive: false });
    window.addEventListener('pointerup', pusteni);
    window.addEventListener('pointercancel', pusteni);
    return () => {
      window.removeEventListener('pointermove', pohyb);
      window.removeEventListener('pointerup', pusteni);
      window.removeEventListener('pointercancel', pusteni);
    };
  }, [onDrop]);

  return { zacni, stav };
}
