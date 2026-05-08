import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSafeShopProductImageUrl } from '@/lib/shopProductImages';
import type { ShopProduct } from '@/types/database';

function toPublicProduct(product: ShopProduct) {
  return {
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    price: product.price,
    ageRange: product.age_range,
    level: product.level,
    leadTime: product.lead_time,
    image: getSafeShopProductImageUrl(product.image_url),
    description: product.description,
    longDescription: product.long_description,
    includes: product.includes,
    highlights: product.highlights,
    idealFor: product.ideal_for,
    projects: product.projects,
    badge: product.badge,
    type: product.type,
    categoryLabel: product.category_label,
    unlocks: product.unlocks,
    compatibility: product.compatibility,
    sortOrder: product.sort_order,
  };
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('shop_products')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Shop products API error:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }

  return NextResponse.json({
    products: (data as ShopProduct[]).map(toPublicProduct),
  });
}
