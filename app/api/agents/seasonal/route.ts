import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { proModel } from '@/lib/gemini';

export async function POST() {
  const supabase = await createClient();

  const [{ data: children }, { data: boxedClothes }] = await Promise.all([
    supabase.from('children').select('name, current_sizes').eq('active', true),
    supabase
      .from('clothes')
      .select('id, size, season, child_name, box_id, boxes(box_number)')
      .eq('status', 'in_box'),
  ]);

  if (!children || !boxedClothes) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const upcomingSeason =
    month >= 3 && month <= 5
      ? 'summer'
      : month >= 9 && month <= 11
      ? 'winter'
      : month >= 6 && month <= 8
      ? 'summer'
      : 'winter';

  const prompt = `
אתה עוזר חכם לניהול ארון בגדים למשפחה. 
המידע הבא מתאר את ילדי המשפחה ואת הבגדים שנמצאים כרגע בקופסאות אחסון.

**עונה הקרובה:** ${upcomingSeason === 'summer' ? 'קיץ' : 'חורף'}
**תאריך היום:** ${now.toLocaleDateString('he-IL')}

**ילדים ומידות פעילות:**
${JSON.stringify(children, null, 2)}

**בגדים בקופסאות:**
${JSON.stringify(
  boxedClothes.map((c) => ({
    מזהה: c.id,
    מידה: c.size,
    עונה: c.season,
    ילד: c.child_name,
    קופסה: (c.boxes as unknown as { box_number: number } | null)?.box_number,
  })),
  null,
  2
)}

**המשימה שלך:**
בדוק אילו קופסאות מכילות בגדים שמתאימים לעונה הקרובה (${upcomingSeason}) 
ולמידות הפעילות של כל ילד.
כתוב סיכום ידידותי ומפורט בעברית הכולל:
1. לכל ילד — אילו מספרי קופסאות כדאי להוציא
2. כמה פריטים רלוונטיים נמצאו בכל קופסה
3. המלצה מסודרת ופרקטית

אם אין פריטים רלוונטיים לילד מסוים, ציין זאת בנימה חיובית.
`;

  try {
    const result = await proModel.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ report: text, season: upcomingSeason });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
