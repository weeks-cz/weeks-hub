import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Ikona sekce — stejná, jakou má položka v levém menu. */
  icon?: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  /** Tlačítka vpravo. Na úzké obrazovce se zalomí pod nadpis. */
  actions?: ReactNode;
}

/**
 * Hlavička stránky.
 *
 * Každá sekce si ji dřív kreslila po svém — někde ikona v rámečku, jinde jen
 * nadpis, jinde nadpis s tlačítky v jiné velikosti. Při přecházení mezi
 * sekcemi to působilo, jako by šlo o tři různé aplikace.
 *
 * Ikona je schválně tatáž jako v menu: po kliknutí se zopakuje nahoře na
 * stránce a člověk má potvrzeno, kde je.
 */
export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] truncate">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
