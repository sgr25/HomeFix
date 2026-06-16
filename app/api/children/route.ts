import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';
import { isChildGender, syncChildSizes } from '@/lib/clothes-utils';

export async function GET() {
  const { supabase } = await getApiContext();

  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { supabase, userId } = await getApiContext();
  const body = await request.json();
  const { name: rawName, current_size, current_sizes, gender } = body;
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!isChildGender(gender)) {
    return NextResponse.json({ error: 'gender is required (boys or girls)' }, { status: 400 });
  }

  const sizes = syncChildSizes(current_size, current_sizes);

  const { data: existing, error: lookupError } = await supabase
    .from('children')
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  if (existing) {
    if (existing.active) {
      return NextResponse.json({ error: 'ילד בשם זה כבר קיים' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('children')
      .update({ active: true, ...sizes, gender, user_id: userId })
      .eq('name', name)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 200 });
  }

  const { data, error } = await supabase
    .from('children')
    .insert({ name, ...sizes, gender, user_id: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
