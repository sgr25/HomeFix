import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';
import { aggregateGrowthScan } from '@/lib/growth-utils';

type Params = { params: Promise<{ name: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { supabase } = await getApiContext();
  const { name } = await params;
  const body = await request.json();
  const old_size = typeof body.old_size === 'string' ? body.old_size.trim() : '';
  const new_size = typeof body.new_size === 'string' ? body.new_size.trim() : '';

  if (!old_size || !new_size) {
    return NextResponse.json({ error: 'old_size and new_size required' }, { status: 400 });
  }

  const { data: child } = await supabase
    .from('children')
    .select('name, gender')
    .eq('name', name)
    .eq('active', true)
    .maybeSingle();

  if (!child) return NextResponse.json({ error: 'ילד לא נמצא' }, { status: 404 });

  let boxedQuery = supabase
    .from('clothes')
    .select('id, clothing_type, season, box_id, boxes(box_number)')
    .eq('status', 'in_box')
    .eq('size', new_size);

  if (child.gender === 'boys') {
    boxedQuery = boxedQuery.in('gender', ['boys', 'unassigned']);
  } else if (child.gender === 'girls') {
    boxedQuery = boxedQuery.in('gender', ['girls', 'unassigned']);
  }

  const [{ data: boxedRaw, error: boxErr }, { data: outdatedRaw, error: closetErr }] = await Promise.all([
    boxedQuery,
    supabase
      .from('clothes')
      .select('id')
      .eq('status', 'in_closet')
      .eq('child_name', name)
      .eq('size', old_size),
  ]);

  if (boxErr || closetErr) {
    return NextResponse.json(
      { error: boxErr?.message ?? closetErr?.message ?? 'שגיאה בשליפת נתונים' },
      { status: 500 }
    );
  }

  const outdatedIds = (outdatedRaw ?? []).map((r: { id: string }) => r.id);
  const result = aggregateGrowthScan(
    name,
    old_size,
    new_size,
    (boxedRaw ?? []) as Parameters<typeof aggregateGrowthScan>[3],
    outdatedIds
  );

  return NextResponse.json(result);
}
