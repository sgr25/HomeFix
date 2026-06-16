import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from('clothes')
    .select('*, boxes(id, box_number, description), children(name, current_sizes)')
    .order('updated_at', { ascending: false });

  const child = searchParams.get('child');
  const season = searchParams.get('season');
  const status = searchParams.get('status');
  const box_id = searchParams.get('box_id');

  if (child)  query = query.eq('child_name', child);
  if (season) query = query.eq('season', season);
  if (status) query = query.eq('status', status);
  if (box_id) query = query.eq('box_id', box_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { child_name, size, season, image_url, status, box_id } = body;

  if (!size || !season || !image_url || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (status === 'in_box' && !box_id) {
    return NextResponse.json({ error: 'box_id required when status is in_box' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('clothes')
    .insert({
      child_name: child_name || null,
      size,
      season,
      image_url,
      status,
      box_id: status === 'in_box' ? box_id : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
