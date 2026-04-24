import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { prompt, model, category, aspectRatio, systemPrompt, styleName, enhance = true } = await request.json();
    const pollinationsKey = process.env.POLLINATIONS_API_KEY;

    let finalPrompt = prompt;

    // 1. Prompt Enhancement
    if (enhance && category !== 'audio' && category !== 'text') {
      try {
        const styleInstruction = styleName ? `Applying style: ${styleName}. ` : "";
        const enhanceResponse = await axios.post('https://gen.pollinations.ai/v1/chat/completions', {
          model: 'openai-fast',
          messages: [
            { 
              role: 'system', 
              content: `You are a professional prompt engineer for AI image generation. ${styleInstruction}${systemPrompt || process.env.SYSTEM_ENHANCE_PROMPT || "Transform user input into a highly detailed artistic prompt."} Ensure the output is ONLY in English and contains NO extra explanations or quotes.` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8
        }, {
          headers: pollinationsKey ? { 'Authorization': `Bearer ${pollinationsKey}` } : {},
          timeout: 40000
        });

        const enhanced = enhanceResponse.data?.choices?.[0]?.message?.content?.trim();
        if (enhanced) finalPrompt = enhanced;
      } catch (err: any) {
        console.warn('Enhancement failed:', err.message);
      }
    }

    // 2. Build Pollinations URL
    const params = new URLSearchParams();
    params.set('model', model || 'flux');
    if (pollinationsKey) params.set('key', pollinationsKey);
    params.set('seed', Math.floor(Math.random() * 1000000).toString());
    params.set('nologo', 'true');

    let imageUrl = '';
    const [width, height] = (aspectRatio || '1024x1024').split('x');

    if (category === 'video') {
      params.set('aspectRatio', parseInt(width) > parseInt(height) ? '16:9' : '9:16');
      imageUrl = `https://gen.pollinations.ai/video/${encodeURIComponent(finalPrompt)}?${params.toString()}`;
    } else if (category === 'audio') {
      imageUrl = `https://gen.pollinations.ai/audio/${encodeURIComponent(prompt)}?${params.toString()}`;
    } else {
      params.set('width', width);
      params.set('height', height);
      imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(finalPrompt)}?${params.toString()}`;
    }

    return NextResponse.json({ 
      success: true, 
      imageUrl, 
      enhancedPrompt: finalPrompt !== prompt ? finalPrompt : null 
    });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
