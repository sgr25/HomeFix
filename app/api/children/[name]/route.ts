import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ name: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { name } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if ('current_sizes' in body) updates.current_sizes = body.current_sizes;
  if ('active' in body) updates.active = body.active;

  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('name', name)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { name } = await params;
  const supabase = await createClient();

  // Soft-delete: mark inactive and unassign clothes
  const { error: childError } = await supabase
    .from('children')
    .update({ active: false })
    .eq('name', name);

  if (childError) return NextResponse.json({ error: childError.message }, { status: 500 });

  // Unassign all clothes belonging to this child
  const { error: clothesError } = await supabase
    .from('clothes')
    .update({ child_name: null })
    .eq('child_name', name);

  if (clothesError) return NextResponse.json({ error: clothesError.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
