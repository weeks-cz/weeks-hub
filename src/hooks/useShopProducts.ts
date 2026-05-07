'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { ShopProduct } from '@/types/database';

export type ShopProductInput = Omit<
  ShopProduct,
  'id' | 'created_by' | 'created_at' | 'updated_at' | 'creator'
>;

export function useShopProducts() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, creator:users(*)')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProducts(data as ShopProduct[]);
      }
    } catch {
      // Keep UI calm on network errors.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('shop-products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  };

  const logActivity = (userId: string, action_type: string, entity_id: string, metadata: Record<string, unknown> = {}) => {
    supabase.from('activity_log').insert({
      user_id: userId,
      action_type,
      entity_type: 'shop_product',
      entity_id,
      metadata,
    }).then(() => {});
  };

  const createProduct = async (product: ShopProductInput) => {
    const userId = await getUserId();
    if (!userId) return null;

    const { data: newProduct, error } = await supabase
      .from('shop_products')
      .insert({
        ...product,
        created_by: userId,
      })
      .select()
      .single();

    if (newProduct) {
      logActivity(userId, 'shop_product_created', newProduct.id, { name: product.name, slug: product.slug });
      await fetchProducts();
      toast.success('Produkt vytvořen');
    }

    if (error) {
      toast.error(error.code === '23505' ? 'Slug už existuje' : 'Nepodařilo se vytvořit produkt');
    }

    return newProduct as ShopProduct | null;
  };

  const updateProduct = async (productId: string, updates: Partial<ShopProductInput>) => {
    const userId = await getUserId();

    const { error } = await supabase
      .from('shop_products')
      .update(updates)
      .eq('id', productId);

    if (!error) {
      if (userId) logActivity(userId, 'shop_product_updated', productId, { name: updates.name, slug: updates.slug });
      await fetchProducts();
      toast.success('Produkt uložen');
    } else {
      toast.error(error.code === '23505' ? 'Slug už existuje' : 'Nepodařilo se uložit produkt');
    }

    return !error;
  };

  const deleteProduct = async (productId: string) => {
    const userId = await getUserId();
    setProducts((prev) => prev.filter((product) => product.id !== productId));

    const { error } = await supabase
      .from('shop_products')
      .delete()
      .eq('id', productId);

    if (!error) {
      if (userId) logActivity(userId, 'shop_product_deleted', productId);
      toast.success('Produkt smazán');
    } else {
      toast.error('Nepodařilo se smazat produkt');
      fetchProducts();
    }

    return !error;
  };

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
