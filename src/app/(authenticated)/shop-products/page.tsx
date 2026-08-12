'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskListSkeleton } from '@/components/ui/Skeleton';
import { ShopProductCard } from '@/components/shop-products/ShopProductCard';
import { ShopProductModal } from '@/components/shop-products/ShopProductModal';
import { useShopProducts } from '@/hooks/useShopProducts';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import type { ShopProduct, ShopProductType } from '@/types/database';
import { SHOP_PRODUCT_TYPE_CONFIG } from '@/types/database';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { obsahuje } from '@/lib/utils/text';

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
  const { submissions } = useFormSubmissions();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [query, setQuery] = useState('');

  // Zájem z webu podle slugu produktu. Formuláře typu shop_interest nesou
  // product_slug, takže se dá spočítat, o co lidé opravdu stojí.
  const zajemPodleSlugu = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const s of submissions) {
      if (s.form_type !== 'shop_interest' || !s.product_slug) continue;
      mapa.set(s.product_slug, (mapa.get(s.product_slug) ?? 0) + 1);
    }
    return mapa;
  }, [submissions]);

  const zajemCelkem = useMemo(
    () => [...zajemPodleSlugu.values()].reduce((a, b) => a + b, 0),
    [zajemPodleSlugu],
  );

  const filteredProducts = useMemo(() => {
    const dotaz = query.trim();

    return products
      .filter((product) => {
        const matchesType = typeFilter === 'all' || product.type === typeFilter;
        const matchesPublish =
          publishFilter === 'all' ||
          (publishFilter === 'published' && product.published) ||
          (publishFilter === 'draft' && !product.published);
        const matchesQuery =
          !dotaz ||
          obsahuje(
            [product.name, product.slug, product.subtitle, product.description, product.projects.join(' ')].join(' '),
            dotaz,
          );

        return matchesType && matchesPublish && matchesQuery;
      })
      // Nejžádanější nahoru — katalog má odpovídat na otázku "co dělat první".
      .sort((a, b) => (zajemPodleSlugu.get(b.slug) ?? 0) - (zajemPodleSlugu.get(a.slug) ?? 0));
  }, [products, publishFilter, query, typeFilter, zajemPodleSlugu]);

  /**
   * Kolik produktu by zbylo po kliknuti na dany filtr. Pocita se proti
   * ostatnim aktivnim filtrum, takze cislo odpovida tomu, co clovek uvidi.
   */
  const pocty = useMemo(() => {
    const dotaz = query.trim();
    const projdeDotaz = (p: ShopProduct) =>
      !dotaz ||
      obsahuje([p.name, p.slug, p.subtitle, p.description, p.projects.join(' ')].join(' '), dotaz);
    const projdeStav = (p: ShopProduct) =>
      publishFilter === 'all' ||
      (publishFilter === 'published' && p.published) ||
      (publishFilter === 'draft' && !p.published);

    const typu = new Map<TypeFilter, number>();
    for (const f of TYPE_FILTERS) {
      typu.set(
        f.value,
        products.filter(
          (p) => (f.value === 'all' || p.type === f.value) && projdeStav(p) && projdeDotaz(p),
        ).length,
      );
    }

    const zakladProStav = products.filter(
      (p) => (typeFilter === 'all' || p.type === typeFilter) && projdeDotaz(p),
    );
    const stavu = new Map<PublishFilter, number>([
      ['all', zakladProStav.length],
      ['published', zakladProStav.filter((p) => p.published).length],
      ['draft', zakladProStav.filter((p) => !p.published).length],
    ]);

    return { typu, stavu };
  }, [products, publishFilter, query, typeFilter]);

  const currentSelectedProduct = selectedProduct
    ? products.find((product) => product.id === selectedProduct.id) ?? selectedProduct
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Package}
        title="E-shop"
        subtitle={
          products.length === 0
            ? 'Produkty, které se zobrazují na weeks.cz/eshop'
            : [
                `${products.filter((p) => p.published).length} z ${products.length} publikovaných`,
                zajemCelkem > 0 ? `${zajemCelkem}× projevený zájem` : null,
              ]
                .filter(Boolean)
                .join(' · ')
        }
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Nový produkt
          </Button>
        }
      />

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
              <span className="ml-1.5 opacity-60">{pocty.typu.get(filter.value) ?? 0}</span>
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
              <span className="ml-1.5 opacity-60">{pocty.stavu.get(filter.value) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Hledat produkt, projekt nebo popis…"
        label="Hledat v produktech"
        className="max-w-md"
      />

      {loading ? (
        <TaskListSkeleton />
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8">
          {/* Prazdno ma tri ruzne priciny a pokazde se z nej ven jde jinudy. */}
          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Zatím tu není žádný produkt"
              description="Odsud se plni weeks.cz/eshop. Zalozte prvni a nechte ho nepublikovany, dokud nebude hotovy."
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" />
                  Nový produkt
                </Button>
              }
            />
          ) : query.trim() ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title={`Na „${query.trim()}“ nic nesedí`}
              description="Hleda se v nazvu, slugu, popisu i v projektech."
              action={
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Zrušit hledání
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Filtrům nic neodpovídá"
              description="V katalogu produkty jsou, jen ne v teto kombinaci typu a stavu."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTypeFilter('all');
                    setPublishFilter('all');
                  }}
                >
                  Zrušit filtry
                </Button>
              }
            />
          )}
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
                <ShopProductCard
                  product={product}
                  zajem={zajemPodleSlugu.get(product.slug) ?? 0}
                  onClick={() => setSelectedProduct(product)}
                />
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
        zajem={currentSelectedProduct ? zajemPodleSlugu.get(currentSelectedProduct.slug) ?? 0 : 0}
        isOpen={!!currentSelectedProduct}
        onClose={() => setSelectedProduct(null)}
        onCreate={createProduct}
        onUpdate={updateProduct}
        onDelete={deleteProduct}
      />
    </div>
  );
}
