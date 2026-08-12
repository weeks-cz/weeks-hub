'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskListSkeleton } from '@/components/ui/Skeleton';
import { ShopProductCard } from '@/components/shop-products/ShopProductCard';
import { ShopProductModal } from '@/components/shop-products/ShopProductModal';
import { useShopProducts } from '@/hooks/useShopProducts';
import type { ShopProduct, ShopProductType } from '@/types/database';
import { SHOP_PRODUCT_TYPE_CONFIG } from '@/types/database';
import { PageHeader } from '@/components/ui/PageHeader';

type TypeFilter = 'all' | ShopProductType;
type PublishFilter = 'all' | 'published' | 'draft';

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Vše' },
  ...Object.entries(SHOP_PRODUCT_TYPE_CONFIG).map(([key, config]) => ({
    value: key as ShopProductType,
    label: config.label,
  })),
];

const PUBLISH_FILTERS: { value: PublishFilter; label: string }[] = [
  { value: 'all', label: 'Vše' },
  { value: 'published', label: 'Publikované' },
  { value: 'draft', label: 'Skryté' },
];

export default function ShopProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useShopProducts();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('cs-CZ');

    return products.filter((product) => {
      const matchesType = typeFilter === 'all' || product.type === typeFilter;
      const matchesPublish =
        publishFilter === 'all' ||
        (publishFilter === 'published' && product.published) ||
        (publishFilter === 'draft' && !product.published);
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.slug, product.subtitle, product.description, product.projects.join(' ')]
          .join(' ')
          .toLocaleLowerCase('cs-CZ')
          .includes(normalizedQuery);

      return matchesType && matchesPublish && matchesQuery;
    });
  }, [products, publishFilter, query, typeFilter]);

  const currentSelectedProduct = selectedProduct
    ? products.find((product) => product.id === selectedProduct.id) ?? selectedProduct
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          icon={Package}
          title="E-shop"
          subtitle="Produkty, které se zobrazují na weeks.cz/eshop"
          actions={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Nový produkt
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                typeFilter === filter.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {PUBLISH_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setPublishFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                publishFilter === filter.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Hledat produkt"
          className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>

      {loading ? (
        <TaskListSkeleton />
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8">
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Žádné produkty"
            description={products.length === 0 ? 'Zatím nebyl vytvořen žádný produkt' : 'Zkuste změnit filtry'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ShopProductCard product={product} onClick={() => setSelectedProduct(product)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ShopProductModal
        product={null}
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createProduct}
        onUpdate={updateProduct}
        onDelete={deleteProduct}
      />

      <ShopProductModal
        product={currentSelectedProduct}
        isOpen={!!currentSelectedProduct}
        onClose={() => setSelectedProduct(null)}
        onCreate={createProduct}
        onUpdate={updateProduct}
        onDelete={deleteProduct}
      />
    </div>
  );
}
