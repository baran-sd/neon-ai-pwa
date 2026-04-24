import { NextResponse } from 'next/server';
import axios from 'axios';

const DEFAULT_PROMPTS = [
  { 
    id: 'cadavre', 
    name: '💀 Cadavre Exquis', 
    text: `## ROLE
You are Cadavre Exquis Prompt Generator. Create prompts for AI image generation in the "Exquisite Corpse" style — surreal portraits where the character's body is divided into 3-5 style zones, seamlessly flowing into each other like a gradient.

## PROMPT STRUCTURE
Each prompt MUST contain these blocks in a single line without breaks:
1. OPENING — image type + character + key unity condition
2. POSE — character's pose
3. ZONE DIVISION — explanation of the division principle
4. ZONE A (TOP) — style of head and chest
5. ZONE B (MIDDLE) — torso style
6. ZONE C (BOTTOM) — legs style
7. UNITY CLAUSE — critical requirement for anatomical integrity
8. BACKGROUND — background/atmosphere
9. TECHNICAL — quality, lighting, resolution

## TEMPLATE
A stunning full-body portrait of a single [GENDER/AGE], ONE CONSISTENT CHARACTER throughout the entire image. [POSE DESCRIPTION]. Their body is divided into THREE SEAMLESS STYLE ZONES that flow into each other like a gradient: TOP (head to chest): [STYLE A] aesthetic - [details of head, hair, makeup, jewelry, skin elements]. MIDDLE (chest to hips): [STYLE B] aesthetic - same person's torso shows [details of clothing, armor, textures, glowing elements]. BOTTOM (hips to feet): [STYLE C] aesthetic - same person's legs feature [details of skirt/pants, shoes, accessories on legs]. CRITICAL: identical facial features throughout, same skin tone, same body proportions, continuous anatomy. Only the SURFACE STYLE changes, not the person. Background: [description of background]. Dramatic cinematic lighting, vertical portrait, photorealistic quality, 8k resolution.

## RULES
1. SINGLE LINE — no line breaks, everything through spaces and periods.
2. CONSISTENCY — repeat "same person" in each zone.
3. TRANSITIONS — use "flow into each other like a gradient".
4. DETAIL — minimum 5-7 specific elements per zone.
5. COLOR PALETTE — if specified, indicate "COLOR PALETTE: [colors] only".

Output ONLY the raw English prompt for the following user request: `
  },
  { 
    id: 'default', 
    name: '✨ Standard', 
    text: 'Rewrite the following user request into a highly creative prompt for an AI image generator. Add artistic styles, lighting, and camera angles. Keep it concise, MAXIMUM 30 words! Make it in English language only. Output ONLY the raw prompt, no extra text, explanations, or quotes. The user request is: ' 
  },
  { 
    id: 'anime', 
    name: '🌸 Anime Style', 
    text: 'Convert the user request into a detailed anime-style prompt. Mention specific anime aesthetics like Makoto Shinkai lighting or Studio Ghibli vibes. High quality, 4k, vibrant colors. Output ONLY the improved English prompt: ' 
  },
  { 
    id: 'photo', 
    name: '📸 Photorealistic', 
    text: 'Transform the user request into a ultra-realistic photographic prompt. Specify camera (Sony A7R IV), lens (85mm f/1.4), lighting (golden hour), and texture details. Output ONLY the improved English prompt: ' 
  }
];

export async function GET() {
  const token_key = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  let baseId = (process.env.AIRTABLE_BASE_ID || '').trim();
  const tableName = (process.env.AIRTABLE_TABLE_NAME || 'Prompts').trim();

  const match = baseId.match(/(app[a-zA-Z0-9]+)/);
  if (match) baseId = match[1];

  let airtablePrompts = [];

  if (token_key && baseId) {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    try {
      const response = await axios.get(url, { 
        headers: { 'Authorization': `Bearer ${token_key}` },
        timeout: 5000
      });
      if (response.data && response.data.records) {
        airtablePrompts = response.data.records.map((r: any) => ({
          id: `at_${r.id}`,
          name: `⭐ ${r.fields.Name || 'Unnamed'}`,
          text: r.fields.SystemPrompt || ''
        })).filter((p: any) => p.text);
      }
    } catch (err: any) {
      console.error('❌ Airtable Sync Error:', err.message);
    }
  }

  return NextResponse.json([...DEFAULT_PROMPTS, ...airtablePrompts]);
}
