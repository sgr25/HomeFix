import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const allowed = ['child_name', 'size', 'season', 'image_url', 'status', 'box_id', 'set_name'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Enforce box_id nullity based on status
  if ('status' in updates) {
    if (updates.status !== 'in_box') updates.box_id = null;
  }

  const { data, error } = await supabase
    .from('clothes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Fetch the item to get the image URL before deleting
  const { data: item, error: fetchError } = await supabase
    .from('clothes')
    .select('image_url')
    .eq('id', id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });

  // Delete the storage object if it exists
  if (item?.image_url) {
    const url = new URL(item.image_url);
    // Extract path after /storage/v1/object/public/clothing-images/
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/clothing-images\/(.+)/);
    if (pathMatch) {
      await serviceClient.storage.from('clothing-images').remove([pathMatch[1]]);
    }
  }

  const { error } = await supabase.from('clothes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
