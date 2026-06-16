import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';

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
  const { name: rawName, current_sizes } = await request.json();
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const sizes = Array.isArray(current_sizes) ? current_sizes : [];

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
      .update({ active: true, current_sizes: sizes, user_id: userId })
      .eq('name', name)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 200 });
  }

  const { data, error } = await supabase
    .from('children')
    .insert({ name, current_sizes: sizes, user_id: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
