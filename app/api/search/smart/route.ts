import { NextRequest, NextResponse } from 'next/server';
import { getApiContext } from '@/lib/auth';
import { flashModel } from '@/lib/gemini';
import type { ClothingType } from '@/types';

interface SmartFilters {
  child_name?: string;
  season?: 'summer' | 'winter' | 'transition';
  status?: 'in_closet' | 'laundry' | 'in_box';
  gender?: 'boys' | 'girls' | 'unassigned';
  clothing_type?: ClothingType;
  set_name?: string;
  free_text_query?: string;
}

export async function POST(request: NextRequest) {
  const { query } = await request.json();

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const { supabase } = await getApiContext();

  // Fetch context for the model
  const [{ data: activeChildren }, { data: boxes }] = await Promise.all([
    supabase.from('children').select('name, gender').eq('active', true),
    supabase.from('boxes').select('id, box_number, description'),
  ]);

  const childrenList = (activeChildren ?? []) as { name: string; gender: string | null }[];
  const childrenContext = childrenList
    .map((c) => `${c.name}${c.gender === 'boys' ? ' (בן)' : c.gender === 'girls' ? ' (בת)' : ''}`)
    .join(', ');
  const boxList = (boxes ?? []).map((b: { box_number: number; description: string | null }) =>
    `ארגז #${b.box_number}${b.description ? ` (${b.description})` : ''}`
  );

  const prompt = `
אתה עוזר חכם לניהול מלאי בגדים. המשתמש שלח שאילתת חיפוש בעברית.

**ילדים פעילים במערכת (שם ומגדר):** ${childrenContext || 'אין'}
**ארגזי אחסון:** ${boxList.join(', ') || 'אין'}

**שאילתת המשתמש:** "${query}"

נתח את כוונת המשתמש והחזר אובייקט JSON בלבד (ללא הסבר, ללא markdown) עם הפילטרים הרלוונטיים:
{
  "child_name": "<שם ילד מהרשימה אם מוזכר, אחרת אל תכלול>",
  "season": "<summer|winter|transition אם מוזכר, אחרת אל תכלול>",
  "status": "<in_closet|laundry|in_box אם מוזכר, אחרת אל תכלול>",
  "gender": "<boys|girls|unassigned אם מוזכר, אחרת אל תכלול>",
  "clothing_type": "<set|shirt|pants|skirt|jumper|pajamas|overall|dress|underwear|tights|socks|hair_accessory|unassigned אם מוזכר סוג בגד, אחרת אל תכלול>",
  "set_name": "<שם סט מדויק אם מוזכר, אחרת אל תכלול>",
  "free_text_query": "<מילות חיפוש חופשיות אם יש (צבע, תיאור, וכד'), אחרת אל תכלול>"
}

מיפוי סטטוסים: "ארון"/"בארון" → in_closet, "כביסה" → laundry, "ארגז"/"מאוחסן" → in_box.
מיפוי עונות: "קיץ"/"חם" → summer, "חורף"/"קר" → winter, "אביב"/"סתיו"/"מעבר" → transition.
מיפוי מגדר: "בנים"/"בן"/"בגדי בנים" → boys, "בנות"/"בת"/"בגדי בנות" → girls, "ללא שיוך"/"יוניסקס"/"ניטרלי" → unassigned.
מיפוי סוגי בגדים:
  "סט"/"חליפה"/"סטים"/"חליפות" → set
  "חולצה"/"חולצות"/"טי"/"טישirt" → shirt
  "מכנס"/"מכנסיים"/"מכנסי"/"שורט" → pants
  "חצאית"/"חצאיות"/"סקirt" → skirt
  "סרפן"/"סרפנים" → jumper
  "פיג'מה"/"פיגמות"/"פיגamas" → pajamas
  "אוברול"/"אוברולים" → overall
  "שמלה"/"שמלות" → dress
  "לבנים"/"תחתונים"/"underwear" → underwear
  "גרביונים"/"tights" → tights
  "גרביים"/"גרב"/"socks" → socks
  "קישוט שיער"/"סרט"/"גומייה"/"תסרוקת" → hair_accessory
אם מוזכר סוג בגד — השתמש ב-clothing_type ואל תכלול אותו ב-free_text_query.
אם מוזכר שם ילד מהרשימה — השתמש גם במגדר שלו כ-filter (gender) אלא אם המשתמש ציין מגדר אחר במפורש.
השתמש אך ורק בשמות ילדים שמופיעים ברשימה. החזר JSON בלבד.
`;

  let filters: SmartFilters = {};

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text().trim();
    // Strip potential markdown code fences
    const jsonText = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    filters = JSON.parse(jsonText);
  } catch {
    // If Gemini fails or returns bad JSON, run a plain text fallback
    filters = { free_text_query: query };
  }

  // Build Supabase query from extracted filters
  let dbQuery = supabase
    .from('clothes')
    .select('*, boxes(id, box_number, description), children(name, current_size, current_sizes)')
    .order('updated_at', { ascending: false });

  if (filters.child_name) dbQuery = dbQuery.eq('child_name', filters.child_name);
  if (filters.season)     dbQuery = dbQuery.eq('season', filters.season);
  if (filters.status)     dbQuery = dbQuery.eq('status', filters.status);
  if (filters.gender)     dbQuery = dbQuery.eq('gender', filters.gender);
  if (filters.clothing_type) dbQuery = dbQuery.eq('clothing_type', filters.clothing_type);
  if (filters.set_name)   dbQuery = dbQuery.ilike('set_name', `%${filters.set_name}%`);
  if (filters.free_text_query) {
    const q = `%${filters.free_text_query}%`;
    dbQuery = dbQuery.or(`set_name.ilike.${q},size.ilike.${q}`);
  }

  const { data, error } = await dbQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ filters, items: data ?? [] });
}
