import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  const { supabase } = await getApiContext();

  const { ids, updates } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const results = [];

  for (const id of ids) {
    const patch: Record<string, unknown> = { ...updates };

    if (patch.status === 'in_box' && !patch.box_id) {
      return NextResponse.json({ error: 'box_id required when status is in_box' }, { status: 400 });
    }
    if (patch.status && patch.status !== 'in_box') {
      patch.box_id = null;
    }
    if (patch.status === 'in_box') {
      patch.child_name = null;
    }

    const { data, error } = await supabase
      .from('clothes')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    results.push(data);
  }

  return NextResponse.json({ updated: results.length, items: results });
}

export async function DELETE(request: NextRequest) {
  const { supabase } = await getApiContext();

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  for (const id of ids) {
    const { error } = await supabase.from('clothes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: ids.length });
}
