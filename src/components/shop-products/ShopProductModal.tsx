'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import type { ShopProduct, ShopProductType } from '@/types/database';
import { SHOP_PRODUCT_TYPE_CONFIG } from '@/types/database';
import type { ShopProductInput } from '@/hooks/useShopProducts';
import { DEFAULT_SHOP_PRODUCT_IMAGE_URL, getSafeShopProductImageUrl } from '@/lib/shopProductImages';

interface ShopProductModalProps {
  product: ShopProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (product: ShopProductInput) => Promise<unknown>;
  onUpdate: (productId: string, updates: Partial<ShopProductInput>) => Promise<boolean>;
  onDelete: (productId: string) => Promise<boolean>;
}

const blankProduct: ShopProductInput = {
  slug: '',
  name: '',
  subtitle: '',
  type: 'set',
  price: 0,
  age_range: '',
  level: '',
  lead_time: 'Sbíráme zájem',
  image_url: DEFAULT_SHOP_PRODUCT_IMAGE_URL,
  description: '',
  long_description: '',
  includes: [],
  highlights: [],
  ideal_for: [],
  projects: [],
  badge: '',
  category_label: 'Celá sada',
  unlocks: '',
  compatibility: null,
  published: false,
  sort_order: 0,
};

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function arrayToText(values: string[]) {
  return values.join('\n');
}

function textToArray(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ShopProductModal({
  product,
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: ShopProductModalProps) {
  const [form, setForm] = useState<ShopProductInput>(blankProduct);
  const [includesText, setIncludesText] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [idealForText, setIdealForText] = useState('');
  const [projectsText, setProjectsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const source = product
      ? {
          slug: product.slug,
          name: product.name,
          subtitle: product.subtitle,
          type: product.type,
          price: product.price,
          age_range: product.age_range,
          level: product.level,
          lead_time: product.lead_time,
          image_url: getSafeShopProductImageUrl(product.image_url),
          description: product.description,
          long_description: product.long_description,
          includes: product.includes,
          highlights: product.highlights,
          ideal_for: product.ideal_for,
          projects: product.projects,
          badge: product.badge,
          category_label: product.category_label,
          unlocks: product.unlocks,
          compatibility: product.compatibility,
          published: product.published,
          sort_order: product.sort_order,
        }
      : blankProduct;

    setForm(source);
    setIncludesText(arrayToText(source.includes));
    setHighlightsText(arrayToText(source.highlights));
    setIdealForText(arrayToText(source.ideal_for));
    setProjectsText(arrayToText(source.projects));
  }, [isOpen, product]);

  const updateForm = <K extends keyof ShopProductInput>(key: K, value: ShopProductInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: product ? current.slug : slugify(value),
    }));
  };

  const handleTypeChange = (type: ShopProductType) => {
    setForm((current) => ({
      ...current,
      type,
      category_label: SHOP_PRODUCT_TYPE_CONFIG[type].label,
    }));
  };

  const uploadImage = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Povolené formáty: JPG, PNG, WebP');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Maximální velikost obrázku je 4 MB');
      return;
    }

    const slug = form.slug || slugify(form.name);
    if (!slug) {
      toast.error('Nejdřív vyplňte název nebo slug produktu');
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${slug}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('shop-product-images')
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error(`Nahrávání selhalo: ${error.message}`);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('shop-product-images')
      .getPublicUrl(path);

    updateForm('image_url', publicUrl);
    toast.success('Obrázek nahrán');
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Název a slug jsou povinné');
      return;
    }

    setIsSaving(true);
    const payload: ShopProductInput = {
      ...form,
      slug: slugify(form.slug),
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      price: Math.max(0, Math.round(Number(form.price) || 0)),
      sort_order: Math.round(Number(form.sort_order) || 0),
      age_range: form.age_range.trim(),
      level: form.level.trim(),
      lead_time: form.lead_time.trim() || 'Sbíráme zájem',
      image_url: form.image_url.trim(),
      description: form.description.trim(),
      long_description: form.long_description.trim(),
      includes: textToArray(includesText),
      highlights: textToArray(highlightsText),
      ideal_for: textToArray(idealForText),
      projects: textToArray(projectsText),
      badge: form.badge.trim(),
      category_label: form.category_label.trim() || SHOP_PRODUCT_TYPE_CONFIG[form.type].label,
      unlocks: form.unlocks.trim(),
      compatibility: form.compatibility?.trim() || null,
    };

    if (product) {
      const success = await onUpdate(product.id, payload);
      if (success) onClose();
    } else {
      const created = await onCreate(payload);
      if (created) onClose();
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    await onDelete(product.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Upravit produkt' : 'Nový produkt'} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Název" value={form.name} onChange={(event) => handleNameChange(event.target.value)} required autoFocus />
            <Input label="Slug" value={form.slug} onChange={(event) => updateForm('slug', slugify(event.target.value))} required />
            <Input label="Podtitulek" value={form.subtitle} onChange={(event) => updateForm('subtitle', event.target.value)} />
            <Select
              label="Typ produktu"
              value={form.type}
              onChange={(event) => handleTypeChange(event.target.value as ShopProductType)}
              options={Object.entries(SHOP_PRODUCT_TYPE_CONFIG).map(([key, config]) => ({
                value: key,
                label: config.label,
              }))}
            />
            <Input label="Cena v Kč" type="number" min="0" value={form.price} onChange={(event) => updateForm('price', Number(event.target.value))} />
            <Input label="Pořadí" type="number" value={form.sort_order} onChange={(event) => updateForm('sort_order', Number(event.target.value))} />
            <Input label="Věk" value={form.age_range} onChange={(event) => updateForm('age_range', event.target.value)} placeholder="10-14 let" />
            <Input label="Úroveň" value={form.level} onChange={(event) => updateForm('level', event.target.value)} placeholder="Začátečník" />
            <Input label="Badge" value={form.badge} onChange={(event) => updateForm('badge', event.target.value)} />
            <Input label="Popisek typu" value={form.category_label} onChange={(event) => updateForm('category_label', event.target.value)} />
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <Input label="URL obrázku" value={form.image_url} onChange={(event) => updateForm('image_url', event.target.value)} placeholder="https://..." />
              </div>
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={isUploading}>
                <Upload className="h-4 w-4" />
                Nahrát
              </Button>
            </div>
            {form.image_url && (
              <div className="relative h-32 overflow-hidden rounded-xl border border-[var(--border-default)]">
                <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => updateForm('image_url', '')}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadImage(file);
              }}
              className="hidden"
            />
          </div>

          <Textarea label="Krátký popis" value={form.description} onChange={(event) => updateForm('description', event.target.value)} rows={2} />
          <Textarea label="Dlouhý popis" value={form.long_description} onChange={(event) => updateForm('long_description', event.target.value)} rows={4} />
          <Textarea label="Co odemkne v Učebně" value={form.unlocks} onChange={(event) => updateForm('unlocks', event.target.value)} rows={2} />
          <Textarea label="Kompatibilita / poznámka ke kitu" value={form.compatibility || ''} onChange={(event) => updateForm('compatibility', event.target.value)} rows={2} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Textarea label="Obsah balení (každý řádek jedna položka)" value={includesText} onChange={(event) => setIncludesText(event.target.value)} rows={5} />
            <Textarea label="Hlavní benefity" value={highlightsText} onChange={(event) => setHighlightsText(event.target.value)} rows={5} />
            <Textarea label="Pro koho je produkt" value={idealForText} onChange={(event) => setIdealForText(event.target.value)} rows={5} />
            <Textarea label="Projekty" value={projectsText} onChange={(event) => setProjectsText(event.target.value)} rows={5} />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => updateForm('published', event.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-default)]"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">Publikovat na e-shopu</span>
          </label>

          <div className="flex justify-between gap-3 border-t border-[var(--border-default)] pt-4">
            {product ? (
              <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                Smazat
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Zrušit
              </Button>
              <Button type="button" onClick={handleSave} isLoading={isSaving}>
                {product ? 'Uložit' : 'Vytvořit'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Smazat produkt"
        message={`Opravdu chcete smazat produkt "${product?.name}"?`}
        confirmLabel="Smazat"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
