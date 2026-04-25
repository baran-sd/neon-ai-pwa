import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { prompt, model, category, aspectRatio, systemPrompt, enhance = true } = await request.json();
    const pollinationsKey = process.env.POLLINATIONS_API_KEY;

    let finalPrompt = prompt;

    // 1. Prompt Enhancement
    console.log(`[Generate] Model: ${model}, Enhance: ${enhance}, SystemPrompt: ${systemPrompt?.substring(0, 50)}...`);

    if (enhance && category !== 'audio' && category !== 'text') {
      try {
        const sysMessage = (systemPrompt && systemPrompt.trim()) || process.env.SYSTEM_ENHANCE_PROMPT;
        
        if (sysMessage) {
          // Use a smarter model if a specific system prompt is provided
          const enhanceModel = systemPrompt ? 'openai-large' : 'openai-fast';
          console.log(`[Generate] Using ${enhanceModel} for enhancement`);
          
          const enhanceResponse = await axios.post('https://gen.pollinations.ai/v1/chat/completions', {
            model: enhanceModel,
            messages: [
              { role: 'system', content: sysMessage },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          }, {
            headers: pollinationsKey ? { 'Authorization': `Bearer ${pollinationsKey}` } : {},
            timeout: 40000
          });

          const enhanced = enhanceResponse.data?.choices?.[0]?.message?.content?.trim();
          if (enhanced) {
            console.log('[Generate] Prompt enhanced successfully');
            finalPrompt = enhanced;
          }
        }
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

    // Add reasoning for supported models
    if (model?.includes('nanobanana')) {
      params.set('reasoning', 'pro');
    }

    let imageUrl = '';
    const [width, height] = (aspectRatio || '1024x1024').split('x');

    if (category === 'video') {
      params.set('aspectRatio', parseInt(width) > parseInt(height) ? '16:9' : '9:16');
      if (model === 'wan') params.set('audio', 'true');
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
