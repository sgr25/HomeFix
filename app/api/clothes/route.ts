import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';
import { normalizeClothingItems } from '@/lib/clothes-utils';

export async function GET(request: NextRequest) {
  const { supabase } = await getApiContext();
  const { searchParams } = new URL(request.url);

  const setsForAll = searchParams.get('sets_for_all') === 'true';

  if (setsForAll) {
    // Fetch active children
    const { data: activeChildren, error: childrenError } = await supabase
      .from('children')
      .select('name')
      .eq('active', true);

    if (childrenError) return NextResponse.json({ error: childrenError.message }, { status: 500 });

    const activeNames: string[] = (activeChildren ?? []).map((c: { name: string }) => c.name);

    if (activeNames.length === 0) return NextResponse.json([]);

    // All in-closet items that have a set_name
    const { data: setItems, error: setError } = await supabase
      .from('clothes')
      .select('set_name, child_name')
      .eq('status', 'in_closet')
      .not('set_name', 'is', null);

    if (setError) return NextResponse.json({ error: setError.message }, { status: 500 });

    // Group by set_name and collect which children have it
    const setChildMap: Record<string, Set<string>> = {};
    for (const row of setItems ?? []) {
      if (!row.set_name || !row.child_name) continue;
      if (!setChildMap[row.set_name]) setChildMap[row.set_name] = new Set();
      setChildMap[row.set_name].add(row.child_name);
    }

    // Keep only set_names where every active child has at least one in-closet item
    const completeSets = Object.entries(setChildMap)
      .filter(([, childSet]) => activeNames.every((name) => childSet.has(name)))
      .map(([name]) => name);

    if (completeSets.length === 0) return NextResponse.json([]);

    const { data, error } = await supabase
      .from('clothes')
      .select('*, boxes(id, box_number, description), children(name, current_sizes)')
      .in('set_name', completeSets)
      .order('set_name', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(normalizeClothingItems(data ?? []));
  }

  let query = supabase
    .from('clothes')
    .select('*, boxes(id, box_number, description), children(name, current_sizes)')
    .order('updated_at', { ascending: false });

  const child = searchParams.get('child');
  const season = searchParams.get('season');
  const status = searchParams.get('status');
  const gender = searchParams.get('gender');
  const box_id = searchParams.get('box_id');

  if (child)  query = query.eq('child_name', child);
  if (season) query = query.eq('season', season);
  if (status) query = query.eq('status', status);
  if (gender) query = query.eq('gender', gender);
  if (box_id) query = query.eq('box_id', box_id);

  const { data, error } = await query;
  if (error) {
    const msg = error.message ?? '';
    if (gender && msg.includes('gender')) {
      return NextResponse.json(
        { error: 'עמודת מגדר חסרה במסד הנתונים — הרץ את המיגרציה 005_add_gender.sql ב-Supabase' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(normalizeClothingItems(data ?? []));
}

export async function POST(request: NextRequest) {
  const { supabase, userId } = await getApiContext();
  const body = await request.json();

  const { child_name, size, season, gender, image_url, status, box_id, set_name } = body;

  const validGenders = ['boys', 'girls', 'unassigned'];

  if (!size || !season || !status || !gender) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!validGenders.includes(gender)) {
    return NextResponse.json({ error: 'Invalid gender value' }, { status: 400 });
  }

  if (status === 'in_box' && !box_id) {
    return NextResponse.json({ error: 'box_id required when status is in_box' }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    child_name: child_name || null,
    size,
    season,
    gender,
    image_url: image_url ?? '',
    status,
    box_id: status === 'in_box' ? box_id : null,
    user_id: userId,
  };
  if (set_name) row.set_name = set_name;

  const { data, error } = await supabase
    .from('clothes')
    .insert(row)
    .select()
    .single();

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('gender')) {
      return NextResponse.json(
        { error: 'עמודת מגדר חסרה במסד הנתונים — הרץ את המיגרציה 005_add_gender.sql ב-Supabase' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
