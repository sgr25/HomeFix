import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';
import { isChildGender } from '@/lib/clothes-utils';

type Params = { params: Promise<{ name: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { supabase, userId } = await getApiContext();
  const { name } = await params;
  const body = await request.json();

  if (typeof body.new_name === 'string' && body.new_name.trim() && body.new_name.trim() !== name) {
    const newName = body.new_name.trim();

    const { data: conflict } = await supabase
      .from('children')
      .select('name, active')
      .eq('name', newName)
      .maybeSingle();

    if (conflict?.active) {
      return NextResponse.json({ error: 'ילד בשם זה כבר קיים' }, { status: 409 });
    }

    const { data: current } = await supabase.from('children').select('*').eq('name', name).single();
    if (!current) return NextResponse.json({ error: 'ילד לא נמצא' }, { status: 404 });

    const sizes = 'current_sizes' in body ? body.current_sizes : current.current_sizes;
    const gender = 'gender' in body && isChildGender(body.gender) ? body.gender : current.gender;

    await supabase.from('children').update({ active: false }).eq('name', name);

    if (conflict && !conflict.active) {
      await supabase.from('children').update({ active: true, current_sizes: sizes, gender }).eq('name', newName);
    } else {
      await supabase.from('children').insert({
        name: newName,
        current_sizes: sizes,
        gender,
        active: true,
        user_id: current.user_id ?? userId,
      });
    }

    await supabase.from('clothes').update({ child_name: newName }).eq('child_name', name);

    const { data } = await supabase.from('children').select('*').eq('name', newName).single();
    return NextResponse.json(data);
  }

  const updates: Record<string, unknown> = {};
  if ('current_sizes' in body) updates.current_sizes = body.current_sizes;
  if ('active' in body) updates.active = body.active;
  if ('gender' in body) {
    if (!isChildGender(body.gender)) {
      return NextResponse.json({ error: 'gender must be boys or girls' }, { status: 400 });
    }
    updates.gender = body.gender;
  }

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
  const { supabase } = await getApiContext();
  const { name } = await params;

  const { error: childError } = await supabase
    .from('children')
    .update({ active: false })
    .eq('name', name);

  if (childError) return NextResponse.json({ error: childError.message }, { status: 500 });

  const { error: clothesError } = await supabase
    .from('clothes')
    .update({ child_name: null })
    .eq('child_name', name);

  if (clothesError) return NextResponse.json({ error: clothesError.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
