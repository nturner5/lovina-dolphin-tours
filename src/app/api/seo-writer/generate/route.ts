import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Robust helper to perform fetch with automatic exponential retries on 503 (High Demand) status
async function fetchWithRetry(url: string, options: any, retries = 3, delay = 1500): Promise<Response> {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 && i < retries - 1) {
        console.warn(`⚠️ Google Gemini returned 503 (High Demand). Retrying attempt ${i + 1}/${retries} in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 1.5; // Exponential backoff
        continue;
      }
      return response;
    } catch (e: any) {
      if (i === retries - 1) throw e;
      console.warn(`⚠️ Network failure in fetch attempt ${i + 1}/${retries}. Retrying in ${currentDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= 1.5;
    }
  }
  throw new Error('Fetch failed after max retries.');
}

export async function POST(req: Request) {
  try {
    const { apiKey, topic, keywords, persona, tone, personalExperience } = await req.json();

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!activeApiKey) {
      return NextResponse.json({ error: 'API Key is required to run the AI Writer. Please configure GEMINI_API_KEY on the server or provide one in the browser.' }, { status: 400 });
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

--- START OF MY PERSONAL TRAVEL EXPERIENCES (E-E-A-T Booster) ---
${personalExperience ? `Crucial Guideline: You MUST naturally weave in the following real personal travel anecdotes, first-hand quotes, and raw experiences directly into appropriate sections of the article to maximize Google E-E-A-T, authenticity, and traveler trust: "${personalExperience}"` : 'None provided.'}
--- END OF MY PERSONAL TRAVEL EXPERIENCES ---

Below is the SPECIFIC local marketing and branding context for this website. You MUST align all tour details, prices, guidelines, tone of voice, and value propositions EXACTLY with these guidelines:

--- START OF PRODUCT MARKETING CONTEXT ---
${marketingContext || 'Operating under Bali Dolphin Tours, departing at 7:00 AM to skip sunrise swarms, vetted captains, parallel approach, private dolphin boat.'}
--- END OF PRODUCT MARKETING CONTEXT ---

--- START OF BRANDING & VISUAL CONTEXT ---
${brandingContext || 'V2 Coastal Noir branding, editorial & minimal style, "The Quiet Encounter", "Maritime Excellence", "Private Dolphin Boat".'}
--- END OF BRANDING & VISUAL CONTEXT ---

Structure and formatting rules:
1. Editorial H1 Title: Create a high-click-through-rate, catchy title optimized for SEO at the very top (e.g. # Title).
2. Heading Structure: Break the article down into 5 to 6 comprehensive sections using detailed markdown headings (### H3 and #### H4). Do NOT use H1 or H2 in the body content (start headings at ### or #### to maintain correct SEO page hierarchy).
3. Highly Practical & Non-Fluff with Specific Restaurant & Hotel Recommendations & Links: Provide concrete travel information. Weave in very specific, real recommendations for local dining (e.g., [Warung Nemo on Google Maps](https://maps.google.com/?q=Warung+Nemo+Lovina) for fresh coconut-husk grilled mahi-mahi, [Warung Bongkot](https://maps.google.com/?q=Warung+Bongkot+Lovina) for organic local satay, Buda Lovina, and Munduk coffee houses) and accommodations (e.g., the luxury [Munduk Moding Plantation](https://maps.google.com/?q=Munduk+Moding+Plantation) boutique eco-cabins, [Puri Bagus Lovina](https://maps.google.com/?q=Puri+Bagus+Lovina) volcanic beach resorts, [The Damai](https://maps.google.com/?q=The+Damai+Lovina), or [Sanak Retreat](https://maps.google.com/?q=Sanak+Retreat+Bali)). For every single place you recommend, you MUST provide an actual descriptive markdown link (e.g. Google Maps queries, internal links like /blog/beyond-the-dolphins, or TripAdvisor reviews). Provide specific local transport and timing details. Do not use placeholders.
4. Call-to-Action (CRO) Callouts: Embed 2 to 3 beautiful CRO callout boxes that pitch Lovina Dolphin Watching Tours naturally at logical transition points (e.g., when discussing ocean activities). 
   Format them exactly like this in the markdown:
   :::cro-box
   ### Ready to Experience Lovina Beach?
   Skip the crowded sunrise chase. Book our private 7:00 AM Dolphin Watching Tour or Dolphin Watching + Snorkel Tour with vetted local captains. 
   [Book Your Private Boat Tour Now](/tours)
   :::
5. Advanced Photorealistic Image Prompts: Insert 3 to 4 detailed, photorealistic image prompts placed naturally between paragraphs where an image should go. These will serve as copy-paste prompts for Midjourney/Flux.
   Each prompt must be highly detailed and specify professional camera settings, focal lengths, shutter speed, lighting, and aspect ratios.
   Include specific camera model cues (e.g. "Canon EOS R5" or "Sony a7R V"), specific lens details (e.g. "24mm f/2.8 ultra-wide-angle lens for landscapes", "50mm f/1.2 prime lens for dramatic depth-of-field", "85mm f/1.4 prime lens for intimate travel portraits"), shutter speed (e.g. "shutter speed 1/1000s to freeze moving ocean water droplets and dolphin splashes in sharp focus"), professional lighting (e.g. "volumetric golden hour sunbeams filtering through light morning mist", "moody overcast soft light"), and color styling (e.g. "Coastal Noir style with rich deep indigo and seafoam teal color grading, realistic skin textures, 8k resolution, --ar 16:9").
   Format: ":::image-prompt
   **Midjourney Image Prompt:** A photorealistic, wide-angle cinematic shot of [description], captured on a Canon EOS R5 with a [lens focal length and aperture] at [zoom mm], [shutter speed to freeze splashes], [lighting details], cinematic travel photography style, --ar 16:9"
   :::
6. Comprehensive FAQ Section: Include a list of answers to common traveler concerns about this topic at the end of the post.

7. Strict Factuality & Zero Hallucination Constraint: Factual correctness is absolutely paramount. Under no circumstances should you invent, guess, or hallucinate specific menu items, prices, opening hours, or operational details for real-world establishments.
   - If you are not 100% sure about a specific detail (e.g. exactly what dishes are currently served, exact pricing, specific shop layouts), you MUST default to describing the general culinary style, vibe, and concept of the establishment (e.g., "renowned for their signature wood-fired sourdough breakfasts", "known for their artisanal eggs benedict variations", "sourcing local organic Kintamani coffee beans", "offering premium, minimalist resort-wear") rather than mentioning high-fidelity, made-up dish names, prices, or details.
   - The ONLY highly specific dish names, menu items, or quotes you may include are those directly supplied by the user under the "PERSONAL TRAVEL EXPERIENCES (E-E-A-T Booster)" section, as these are verified first-hand details.

8. Enriched Metadata Block: At the very end of your output, you MUST append a structured metadata block enclosed in [METADATA] and [/METADATA] tags. This metadata will be parsed by our backend to populate rich fields in our database. Do NOT output this block anywhere else or in any other format.
Format:
[METADATA]
TAGS: Sekumpul, North Bali, Waterfalls, Hiking, Travel Guide
TAKEAWAYS:
- Key takeaway bullet point 1 (summarizing section 1)
- Key takeaway bullet point 2 (summarizing section 2)
- Key takeaway bullet point 3 (summarizing section 3)
- Key takeaway bullet point 4 (summarizing section 4)
FAQS:
Q: Question 1?
A: Answer 1.
Q: Question 2?
A: Answer 2.
[/METADATA]

Write the entire, complete blog post in high-quality markdown, maintaining deep local context, slow-travel values, and the Coastal Noir luxury aesthetic. Do not summarize or abbreviate sections—write it in full.

`;

    let generatedText = '';

    if (activeApiKey.startsWith('sk-')) {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices[0]?.message?.content || '';
    } else {
      // Dynamic Model Resolver: Query Google to see what models are specifically active & enabled for this API Key!
      const allowedModels: string[] = [];
      let listError = '';
      
      try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeApiKey}`;
        const listRes = await fetch(listUrl);
        
        if (listRes.ok) {
          const listData = await listRes.json();
          const availableModels = listData.models || [];
          
          // Prioritize standard models from best to most stable
          const priorityList = [
            'gemini-3.5-flash',
            'gemini-3-flash',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-3.1-pro',
            'gemini-1.5-pro'
          ];
          
          for (const priority of priorityList) {
            const found = availableModels.find((m: any) => 
              m.name === `models/${priority}` && 
              m.supportedGenerationMethods?.includes('generateContent')
            );
            if (found) {
              allowedModels.push(found.name);
            }
          }
          
          // Fallback to any model that supports generateContent if none of our priorities match
          if (allowedModels.length === 0 && availableModels.length > 0) {
            const fallback = availableModels.find((m: any) => 
              m.supportedGenerationMethods?.includes('generateContent')
            );
            if (fallback) {
              allowedModels.push(fallback.name);
            }
          }
        } else {
          const errBody = await listRes.json().catch(() => ({}));
          listError = errBody?.error?.message || `HTTP Status ${listRes.status}`;
        }
      } catch (e: any) {
        listError = e.message || 'Network error';
      }

      if (allowedModels.length === 0) {
        throw new Error(`Failed to resolve any active Gemini models. Google API returned: ${listError || 'No supported models found for this key.'}`);
      }

      console.log(`🎯 Discovered active models: ${allowedModels.join(', ')}`);

      // Call the resolved models with a cascading fallback loop and automatic 503 retry protection
      const errors: string[] = [];
      for (const model of allowedModels) {
        try {
          console.log(`📡 Attempting generation using model: ${model}...`);
          const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${activeApiKey}`;
          const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (generatedText) {
              console.log(`✅ Success! Generated content using model ${model}`);
              break;
            }
          } else {
            const errBody = await response.json().catch(() => ({}));
            const apiMessage = errBody?.error?.message || `HTTP Status ${response.status}`;
            errors.push(`${model} -> ${apiMessage}`);
            console.warn(`   ⚠️ Model ${model} failed with message: ${apiMessage}. Cascading to next model...`);
          }
        } catch (e: any) {
          errors.push(`${model} -> ${e.message}`);
          console.warn(`   ⚠️ Model ${model} caught exception: ${e.message}. Cascading to next model...`);
        }
      }

      if (!generatedText) {
        throw new Error(`Gemini API call failed on all available models. Diagnostics:\n${errors.map(err => `• ${err}`).join('\n')}`);
      }
    }

    if (!generatedText) {
      throw new Error('AI Engine failed to return any text content.');
    }

    // Parse structured metadata block from the generated text
    let tags: string[] = [];
    let keyTakeaways: string[] = [];
    let faqs: { question: string; answer: string }[] = [];
    let cleanMarkdown = generatedText;

    const metadataMatch = generatedText.match(/\[METADATA\]([\s\S]*?)\[\/METADATA\]/);
    if (metadataMatch) {
      const metaContent = metadataMatch[1];
      cleanMarkdown = generatedText.replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '').trim();
      
      // Parse TAGS
      const tagsMatch = metaContent.match(/TAGS:\s*(.*)/i);
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
      }
      
      // Parse TAKEAWAYS
      const takeawaysBlock = metaContent.match(/TAKEAWAYS:([\s\S]*?)(?:FAQS:|$)/i);
      if (takeawaysBlock) {
        keyTakeaways = takeawaysBlock[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-') || line.startsWith('*'))
          .map(line => line.replace(/^[-*]\s*/, '').trim());
      }
      
      // Parse FAQS
      const faqsBlock = metaContent.match(/FAQS:([\s\S]*?)$/i);
      if (faqsBlock) {
        const lines = faqsBlock[1].split('\n').map(l => l.trim()).filter(Boolean);
        let currentFaq: { question: string; answer: string } | null = null;
        
        for (const line of lines) {
          const upper = line.toUpperCase();
          if (upper.startsWith('Q:') || upper.startsWith('QUESTION:')) {
            if (currentFaq) faqs.push(currentFaq);
            const qText = line.replace(/^(Q|Question):/i, '').trim();
            currentFaq = { question: qText, answer: '' };
          } else if ((upper.startsWith('A:') || upper.startsWith('ANSWER:')) && currentFaq) {
            const aText = line.replace(/^(A|Answer):/i, '').trim();
            currentFaq.answer = aText;
          } else if (currentFaq) {
            currentFaq.answer = (currentFaq.answer + ' ' + line).trim();
          }
        }
        if (currentFaq) faqs.push(currentFaq);
      }
    }

    return NextResponse.json({ 
      markdown: cleanMarkdown,
      tags,
      keyTakeaways,
      faqs
    });
  } catch (err: any) {
    console.error('AI Generator Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred during blog generation.' }, { status: 500 });
  }
}
