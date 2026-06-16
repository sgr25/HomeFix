import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('boxes')
    .select('*')
    .order('box_number');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { box_number, description } = await request.json();

  if (!box_number) return NextResponse.json({ error: 'box_number is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('boxes')
    .insert({ box_number, description: description ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
