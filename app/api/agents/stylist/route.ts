import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';
import { getStylistModel } from '@/lib/gemini';
import { getWeeklyForecast } from '@/lib/weather';
import type { DayOutfit } from '@/types';

export async function GET() {
  const { supabase } = await getApiContext();

  const [forecastResult, { data: closetClothes }, { data: children }] = await Promise.all([
    getWeeklyForecast().catch(() => null),
    supabase
      .from('clothes')
      .select('id, child_name, size, season, image_url, clothing_type')
      .eq('status', 'in_closet'),
    supabase.from('children').select('name, current_sizes').eq('active', true),
  ]);

  if (!closetClothes || !children) {
    return NextResponse.json({ error: 'Failed to fetch wardrobe data' }, { status: 500 });
  }

  // Group clothes by child
  const byChild: Record<string, typeof closetClothes> = {};
  for (const item of closetClothes) {
    const key = item.child_name ?? '__unassigned__';
    if (!byChild[key]) byChild[key] = [];
    byChild[key].push(item);
  }

  const model = getStylistModel();

  const prompt = `
You are a children's wardrobe stylist assistant.
Generate a 7-day outfit recommendation plan for each child.

**7-Day Weather Forecast:**
${forecastResult ? JSON.stringify(forecastResult, null, 2) : 'Weather data unavailable — use seasonal judgment'}

**Available Clothes in Closet (grouped by child, each item has clothing_type):**
${JSON.stringify(byChild, null, 2)}

**Clothing Types Reference:**
- set, dress, jumper, overall, pajamas = complete outfits (one item covers the day)
- shirt + pants OR shirt + skirt = valid two-piece outfit
- socks, hair_accessory = optional accessories (add only if available)
- underwear, tights = not daily outfit items (do not recommend as main outfit)
- unassigned = avoid unless no other option

**Children's Active Sizes:**
${JSON.stringify(children, null, 2)}

**Outfit Composition Rules (MANDATORY for each day per child):**
1. Core outfit (required): Choose EITHER:
   - ONE item of type: set, dress, jumper, overall, or pajamas
   - OR exactly TWO complementary items: one shirt + one pants OR one shirt + one skirt
2. Optional accessories: If available in that child's closet, you MAY add socks and/or hair_accessory.
3. Forbidden combinations:
   - Never two shirts on the same day
   - Never dress/jumper/overall/set together with pants or skirt on the same day
   - Never recommend underwear or tights as main daily outfit items

**General Rules:**
- Match clothing season to forecast temperature: summer items for >22°C, winter for <15°C, transition in between.
- Never recommend the same item two days in a row.
- Return exactly one entry per child per day for the next 7 days.
- Use actual ISO dates starting from today: ${new Date().toISOString().slice(0, 10)}
- Only use item IDs that exist in the available clothes data.
- Each item ID in "items" must match the clothing_type rules above.
- If a child has insufficient items, repeat with the least recently used while still following outfit rules.

Return the result as a JSON array matching the schema exactly.
`;

  try {
    const result = await model.generateContent(prompt);
    const outfits: DayOutfit[] = JSON.parse(result.response.text());
    return NextResponse.json({ outfits, forecast: forecastResult });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Mark recommended items as laundry (Worn Today) */
export async function POST(request: Request) {
  const { supabase } = await getApiContext();
  const { item_ids }: { item_ids: string[] } = await request.json();

  if (!item_ids?.length) {
    return NextResponse.json({ error: 'item_ids required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('clothes')
    .update({ status: 'laundry', box_id: null })
    .in('id', item_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ updated: item_ids.length });
}
