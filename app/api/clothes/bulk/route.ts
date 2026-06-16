import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  const { supabase } = await getApiContext();

  const { ids, updates } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  if (updates?.status === 'in_box' && !updates?.box_id) {
    return NextResponse.json({ error: 'box_id required when status is in_box' }, { status: 400 });
  }

  const results = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const id of ids) {
    const { data: existing } = await supabase
      .from('clothes')
      .select('status')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      skipped.push({ id, reason: 'not_found' });
      continue;
    }

    const patch: Record<string, unknown> = { ...updates };

    if ('child_name' in patch && !('status' in patch) && existing.status === 'in_box') {
      skipped.push({ id, reason: 'in_box_cannot_assign_child' });
      continue;
    }

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

  return NextResponse.json({ updated: results.length, skipped, items: results });
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
