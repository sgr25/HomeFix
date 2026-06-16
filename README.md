# ארון חכם — Smart Wardrobe Management

ניהול מלאי בגדי ילדים, קופסאות אחסון, מעבר עונות, וסטיילינג חכם בסיוע AI.

---

## הגדרת הפרויקט

### דרישות מקדימות
- Node.js 20+
- חשבון Supabase (חינמי)
- מפתח Gemini API (חינמי)
- מפתח OpenWeatherMap (חינמי)

### שלב 1 — הגדרת Supabase

1. צור פרויקט חדש ב-[Supabase](https://supabase.com)
2. עבור ל-SQL Editor והרץ את קבצי המיגרציה לפי הסדר:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_set_name.sql`
   - `supabase/migrations/003_image_url_nullable.sql` (נדרש רק אם כבר הרצת את 001 לפני עדכון זה)
3. עבור ל-Storage → צור Bucket בשם `clothing-images` עם הגדרות **Public**

### שלב 2 — משתני סביבה

```bash
cp .env.local.example .env.local
```

ערוך את `.env.local` והוסף:

| משתנה | מקור |
|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) — חינמי |
| `OPENWEATHER_API_KEY` | [OpenWeatherMap](https://openweathermap.org/api) — חינמי |
| `NEXT_PUBLIC_WEATHER_CITY` | שם העיר לתחזית (ברירת מחדל: Tel Aviv) |

### שלב 3 — הפעלה

```bash
npm install
npm run dev
```

פתח את [http://localhost:3000](http://localhost:3000)

---

## מבנה האפליקציה

| עמוד | נתיב | תיאור |
|------|------|--------|
| לוח בקרה | `/` | סטטיסטיקות, מטריצת לבוש שבועית, דוח עונתי |
| העלאה | `/upload` | גרירת תמונות + טופס מהיר לכל בגד |
| מלאי | `/inventory` | כרטיסיות ניתנות לסינון לפי ילד/עונה/סטטוס |
| קופסאות | `/boxes` | גלריה מורחבת + הדפסת מניפסט לכל קופסה |
| כביסה | `/laundry` | מעקב פריטים בכביסה + החזרה לארון בצובר |

---

## סוכני AI

### סוכן 1: היערכות עונתית (Gemini 1.5 Pro)
לחץ "צור דוח" בדף הבית לקבלת סיכום בעברית על אילו קופסאות להוציא לקראת העונה הקרובה.

### סוכן 2: סטייליסט שבועי (Gemini 1.5 Flash)
לחץ "רענן" בלוח הבקרה לקבלת המלצת לבוש ל-7 ימים על בסיס תחזית מזג האוויר. לחץ "נלבש" בסוף היום כדי להעביר את הבגדים לכביסה.
