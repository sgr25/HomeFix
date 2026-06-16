import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { name, current_sizes } = await request.json();

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('children')
    .insert({ name, current_sizes: current_sizes ?? [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
