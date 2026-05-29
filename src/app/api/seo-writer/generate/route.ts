import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { apiKey, topic, keywords, persona, tone } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required to run the AI Writer.' }, { status: 400 });
    }

    // Read local project marketing and branding guidelines
    let marketingContext = '';
    let brandingContext = '';
    
    try {
      const pmPath = path.join(process.cwd(), '.agents/product-marketing.md');
      if (fs.existsSync(pmPath)) {
        marketingContext = fs.readFileSync(pmPath, 'utf8');
      }
    } catch (e) {
      console.warn('Could not read product-marketing.md context:', e);
    }

    try {
      const bgPath = path.join(process.cwd(), '.agents/branding-guide.md');
      if (fs.existsSync(bgPath)) {
        brandingContext = fs.readFileSync(bgPath, 'utf8');
      }
    } catch (e) {
      console.warn('Could not read branding-guide.md context:', e);
    }

    const prompt = `
You are an elite travel writer and conversion rate optimization (CRO) expert. Your goal is to write a highly detailed, comprehensive, 1,500+ word "authority" travel blog post about the following topic:
Topic: "${topic}"
Target Focus Keywords (incorporate these naturally throughout the headings and body text): "${keywords}"
Target Traveler Persona: "${persona}"
Writing Tone: "${tone || 'Expert, informative, engaging, and premium (similar to the famous Finns Beach Club Bali blog)'}"

Below is the SPECIFIC local marketing and branding context for this website. You MUST align all tour details, prices, guidelines, tone of voice, and value propositions EXACTLY with these guidelines:

--- START OF PRODUCT MARKETING CONTEXT ---
${marketingContext || 'Operating under Lovina Ethical Marine, departing at 8:00 AM to skip sunrise swarms, vetted captains, 30m buffer, parallel approach, private dolphin boat.'}
--- END OF PRODUCT MARKETING CONTEXT ---

--- START OF BRANDING & VISUAL CONTEXT ---
${brandingContext || 'V2 Coastal Noir branding, editorial & minimal style, "The Quiet Encounter", "Maritime Excellence", "Private Dolphin Boat".'}
--- END OF BRANDING & VISUAL CONTEXT ---

Structure and formatting rules:
1. Editorial H1 Title: Create a high-click-through-rate, catchy title optimized for SEO.
2. Heading Structure: Break the article down into 5 to 6 comprehensive sections using detailed markdown headings (### H3 and #### H4). Do NOT use H1 or H2 in the body content (start body headings at ### or #### to maintain correct SEO page hierarchy).
3. Highly Practical & Non-Fluff: Provide concrete travel information. Weave in estimated prices (in USD and IDR), travel times (e.g. driving durations between Southern Bali and Lovina), operational details, what to bring, food warung suggestions, and safety tips. Focus on being genuinely helpful to travelers.
4. Call-to-Action (CRO) Callouts: Embed 2 to 3 beautiful CRO callout boxes that pitch Lovina Dolphin Watching Tours naturally at logical transition points (e.g., when discussing ocean activities). 
   Format them exactly like this in the markdown:
   :::cro-box
   ### Ready to Experience Lovina Beach?
   Skip the crowded sunrise chase. Book our private 8:00 AM Dolphin Watching Tour or Dolphin Watching + Snorkel Tour with vetted local captains. 
   [Book Your Private Boat Tour Now](/tours)
   :::
5. Photorealistic Image Prompts: Insert 3 to 4 detailed, photorealistic image prompts placed naturally between paragraphs where an image should go. These will serve as copy-paste prompts for Midjourney/Flux.
   Format them exactly like this in the markdown:
   :::image-prompt
   **Midjourney Image Prompt:** A photorealistic, wide-angle cinematic shot of ...
   :::
6. Interactive FAQ Section: End with a highly comprehensive FAQ list answering common concerns travelers have about this topic.

Write the entire, complete blog post in high-quality markdown, maintaining deep local context, slow-travel values, and the Coastal Noir luxury aesthetic. Do not summarize or abbreviate sections—write it in full.
`;

    let generatedText = '';

    if (apiKey.startsWith('sk-')) {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices[0]?.message?.content || '';
    } else {
      // Call Gemini API with automatic endpoint/model fallback loop
      const geminiModels = [
        { version: 'v1', name: 'gemini-1.5-flash' },
        { version: 'v1beta', name: 'gemini-1.5-flash' },
        { version: 'v1', name: 'gemini-2.5-flash' },
        { version: 'v1', name: 'gemini-1.5-pro' },
        { version: 'v1beta', name: 'gemini-pro' }
      ];

      let lastError = '';
      
      for (const model of geminiModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (generatedText) {
              console.log(`✅ Success using Gemini model: ${model.name} (${model.version})`);
              break;
            }
          } else {
            const errBody = await response.json().catch(() => ({}));
            lastError = errBody?.error?.message || `Status ${response.status} for ${model.name}`;
            console.warn(`⚠️ Failed for model ${model.name} (${model.version}):`, lastError);
          }
        } catch (e: any) {
          lastError = e.message || 'Network error';
          console.warn(`⚠️ Network failure for ${model.name}:`, lastError);
        }
      }

      if (!generatedText) {
        throw new Error(`Gemini API failed on all fallback models. Last error: ${lastError}`);
      }
    }

    if (!generatedText) {
      throw new Error('AI Engine failed to return any text content.');
    }

    return NextResponse.json({ markdown: generatedText });
  } catch (err: any) {
    console.error('AI Generator Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred during blog generation.' }, { status: 500 });
  }
}
