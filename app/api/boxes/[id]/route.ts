import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { supabase } = await getApiContext();

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if ('box_number' in body) updates.box_number = body.box_number;
  if ('description' in body) updates.description = body.description ?? null;

  const { data, error } = await supabase
    .from('boxes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { supabase } = await getApiContext();

  const { id } = await params;

  const { count } = await supabase
    .from('clothes')
    .select('*', { count: 'exact', head: true })
    .eq('box_id', id);

  if (count && count > 0) {
    return NextResponse.json({ error: 'לא ניתן למחוק קופסה עם פריטים' }, { status: 409 });
  }

  const { error } = await supabase.from('boxes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
