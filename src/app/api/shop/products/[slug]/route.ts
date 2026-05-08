import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('shop_products')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({
    product: toPublicProduct(data as ShopProduct),
  });
}
