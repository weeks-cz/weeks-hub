'use client';

import { Eye, EyeOff } from 'lucide-react';
import type { ShopProduct } from '@/types/database';
import { SHOP_PRODUCT_TYPE_CONFIG } from '@/types/database';
import { getSafeShopProductImageUrl } from '@/lib/shopProductImages';

interface ShopProductCardProps {
  product: ShopProduct;
  onClick: () => void;
}

export function ShopProductCard({ product, onClick }: ShopProductCardProps) {
  const typeConfig = SHOP_PRODUCT_TYPE_CONFIG[product.type];
  const imageUrl = getSafeShopProductImageUrl(product.image_url);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] bg-[var(--bg-primary)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            Bez obrázku
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-lg px-2 py-1 text-[10px] font-semibold"
          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          {typeConfig.label}
        </span>
        <span className="absolute right-3 top-3 rounded-lg bg-black/60 p-1.5 text-white">
          {product.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-[var(--text-muted)]">{product.subtitle || product.slug}</p>
            <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{product.name}</h3>
          </div>
          <div className="shrink-0 text-right text-sm font-bold text-[var(--text-primary)]">
            {product.price.toLocaleString('cs-CZ')} Kč
          </div>
        </div>

        <p className="line-clamp-2 min-h-10 text-xs leading-5 text-[var(--text-secondary)]">
          {product.description || 'Bez krátkého popisu'}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-lg bg-[var(--bg-surface-hover)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            {product.level || 'Bez úrovně'}
          </span>
          <span className="rounded-lg bg-[var(--bg-surface-hover)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            pořadí {product.sort_order}
          </span>
          {!product.published && (
            <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] text-amber-500">
              skryté
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
