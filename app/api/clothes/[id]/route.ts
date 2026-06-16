import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiContext } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { supabase } = await getApiContext();
  const { id } = await params;
  const body = await request.json();

  const allowed = ['child_name', 'size', 'season', 'image_url', 'status', 'box_id', 'set_name'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = key === 'image_url' && body[key] == null ? '' : body[key];
    }
  }

  // Enforce box_id / child_name based on status
  if ('status' in updates) {
    if (updates.status !== 'in_box') {
      updates.box_id = null;
    } else {
      updates.child_name = null;
    }
  }

  const { data, error } = await supabase
    .from('clothes')
    .update(updates)
    .eq('id', id)
    .select('*, boxes(id, box_number, description), children(name, current_sizes)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { supabase } = await getApiContext();
  const { id } = await params;
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
