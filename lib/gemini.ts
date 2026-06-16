import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
export const proModel   = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

/**
 * responseSchema for the Wardrobe Stylist Agent.
 * Enforces a strict JSON array from Gemini — no regex parsing needed.
 */
export const stylistResponseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      date:       { type: SchemaType.STRING, description: 'ISO date YYYY-MM-DD' },
      child_name: { type: SchemaType.STRING },
      items:      {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING, description: 'Clothing item UUID' },
      },
    },
    required: ['date', 'child_name', 'items'],
  },
};

/**
 * Returns a Gemini flash model pre-configured to output strict JSON
 * using the stylist response schema.
 */
export function getStylistModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: stylistResponseSchema as never,
    },
  });
}
