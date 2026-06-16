import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';
import { buildShoppingGapsReport } from '@/lib/shopping-gaps-utils';
import { flashModel } from '@/lib/gemini';
import type { Child, ClothingItem } from '@/types';

export async function POST(request: NextRequest) {
  const { supabase } = await getApiContext();
  const narrative = new URL(request.url).searchParams.get('narrative') === 'true';

  const [{ data: children, error: childErr }, { data: clothes, error: clothesErr }] = await Promise.all([
    supabase.from('children').select('*').eq('active', true).order('name'),
    supabase
      .from('clothes')
      .select('id, child_name, size, season, clothing_type, status')
      .in('status', ['in_closet', 'laundry', 'in_box']),
  ]);

  if (childErr || clothesErr) {
    return NextResponse.json(
      { error: childErr?.message ?? clothesErr?.message ?? 'שגיאה בשליפת נתונים' },
      { status: 500 }
    );
  }

  const report = buildShoppingGapsReport(
    (children ?? []) as Child[],
    (clothes ?? []) as ClothingItem[]
  );

  if (!narrative) {
    return NextResponse.json(report);
  }

  try {
    const prompt = `
אתה עוזר לניהול ארון בגדים למשפחה. להלן דוח מלאי מובנה לפי ילדים, עונות וסוגי בגדים.
המידע מציג כמה פריטים יש במערכת (בארון, כביסה או ארגז) במידה הנוכחית של כל ילד.

${JSON.stringify(report, null, 2)}

כתוב סיכום קצר ומעשי בעברית עם המלצות קניה — מה חסר, מה יש מספיק.
התמקד בפריטים עם count נמוך (0-2) לעומת כאלה עם מלאי גבוה.
`;

    const result = await flashModel.generateContent(prompt);
    return NextResponse.json({ ...report, narrative: result.response.text() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
