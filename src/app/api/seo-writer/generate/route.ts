import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import fs from 'fs';
import path from 'path';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1f5xaxdl',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-05-26',
});

// Location-specific database for stays, dining, and logistics
const LOCATION_DATABASES: Record<string, { stays: string[]; dining: string[]; details: string }> = {
  lovina: {
    stays: [
      "[Puri Bagus Lovina](https://maps.google.com/?q=Puri+Bagus+Lovina) (traditional beachside resort with villas and tropical gardens)",
      "[The Damai Lovina](https://maps.google.com/?q=The+Damai+Lovina) (luxury boutique resort in the hills with farm-to-table organic kitchen)"
    ],
    dining: [
      "[Warung Nemo](https://maps.google.com/?q=Warung+Nemo+Lovina) (celebrated for fresh mahi-mahi and snapper grilled over dry coconut husks)",
      "[Buda Lovina](https://maps.google.com/?q=Buda+Lovina+Cafe) (organic local satay, cold-pressed juices, and vegan treats)",
      "[Warung Singasinga](https://maps.google.com/?q=Warung+Singasinga+Lovina) (authentic Balinese crispy duck and traditional family recipes)"
    ],
    details: "Departures depart at 7:00 AM from the Lovina Dolphin Statue to avoid the standard 6:00 AM crowd rush. Vetted captains only, engines neutral within 30m, and parallel-only approach. Travel time from Canggu is 2.5-3 hours, and from Ubud is 2 hours."
  },
  munduk: {
    stays: [
      "[Munduk Moding Plantation](https://maps.google.com/?q=Munduk+Moding+Plantation) (luxury eco-cabins overlooking coffee plantations with an infinity pool in the clouds)",
      "[Sanak Retreat Bali](https://maps.google.com/?q=Sanak+Retreat+Bali) (wooden bungalows surrounded by active rice terraces and misty mountain peaks)"
    ],
    dining: [
      "[Munduk Coffee House](https://maps.google.com/?q=Munduk+Coffee+House) (featuring artisanal, single-origin Arabica coffee grown on-site)",
      "[Warung Bongkot](https://maps.google.com/?q=Warung+Bongkot+Lovina) (celebrated for utilizing organic wild-ginger bongkot in traditional Balinese dishes)"
    ],
    details: "Highland topography with waterfalls (Sekumpul, Munduk, Gitgit), clove orchards, and volcanic twin lakes. Cooler climates, hiking routes require reef booties or solid hiking footwear."
  },
  ubud: {
    stays: [
      "[Mandapa, a Ritz-Carlton Reserve](https://maps.google.com/?q=Mandapa+Ritz+Carlton+Ubud) (luxury sanctuary along the Ayung River with private pool villas)",
      "[Ubud Hanging Gardens](https://maps.google.com/?q=Hanging+Gardens+of+Bali) (famous for its multi-tiered suspended infinity pools over the jungle)"
    ],
    dining: [
      "[Locavore](https://maps.google.com/?q=Locavore+Ubud) (modern culinary art with 100% locally sourced Indonesian ingredients)",
      "[Suka Espresso Ubud](https://maps.google.com/?q=Suka+Espresso+Ubud) (exceptional specialty coffee and healthy bowls)"
    ],
    details: "Ubud is the cultural heart of Bali. Private drivers pick up guests at ~4:30 AM for a round-trip Lovina dolphin excursion."
  },
  canggu: {
    stays: [
      "[Como Uma Canggu](https://maps.google.com/?q=COMO+Uma+Canggu) (premium surf-front resort on Batu Bolong Beach)",
      "[The Slow](https://maps.google.com/?q=The+Slow+Canggu) (art-focused boutique hotel with brutalist design and organic kitchen)"
    ],
    dining: [
      "[Crate Cafe](https://maps.google.com/?q=Crate+Cafe+Canggu) (vibrant, supercharged breakfast plates and local organic coffee)",
      "[Suka Espresso Canggu](https://maps.google.com/?q=Suka+Espresso+Canggu) (exceptional brunch and specialty brews near Berawa)"
    ],
    details: "Canggu/Seminyak/Kuta are coastal hubs. Return private transfer pickups start at ~4:00 AM due to the 3-hour volcanic mountain pass drive to Lovina."
  },
  uluwatu: {
    stays: [
      "[Alila Villas Uluwatu](https://maps.google.com/?q=Alila+Villas+Uluwatu) (eco-luxury pool villas suspended on limestone cliffs over the Indian Ocean)",
      "[Six Senses Uluwatu](https://maps.google.com/?q=Six+Senses+Uluwatu) (unparalleled ocean views and wellness-focused luxury retreats)"
    ],
    dining: [
      "[Single Fin](https://maps.google.com/?q=Single+Fin+Uluwatu) (iconic cliffside dining and sunset viewpoints)",
      "[Suka Espresso Uluwatu](https://maps.google.com/?q=Suka+Espresso+Uluwatu) (premium coffee and wholesome bowls near Thomas Beach)"
    ],
    details: "Uluwatu/Nusa Dua/Jimbaran are on the southern Bukit Peninsula. Pickups start at ~3:30 AM for a 3.5 to 4-hour drive to Lovina."
  }
};

// Robust helper to perform fetch with automatic exponential retries on 503 (High Demand) status
async function fetchWithRetry(url: string, options: any, retries = 3, delay = 1500, timeout = 15000): Promise<Response> {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout); // Use configurable timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.status === 503 && i < retries - 1) {
        console.warn(`⚠️ Google Gemini returned 503 (High Demand). Retrying attempt ${i + 1}/${retries} in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 1.5;
        continue;
      }
      return response;
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (i === retries - 1) throw e;
      const errorMsg = e.name === 'AbortError' ? `Request timed out after ${timeout / 1000}s` : e.message;
      console.warn(`⚠️ Network failure in fetch attempt ${i + 1}/${retries} (${errorMsg}). Retrying in ${currentDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= 1.5;
    }
  }
  throw new Error('Fetch failed after max retries.');
}

// Clean JSON response block from markdown tags
function cleanJsonString(str: string): string {
  return str
    .replace(/^```json/i, '')
    .replace(/^```/m, '')
    .replace(/```$/m, '')
    .trim();
}

// Optional real-time Tavily search integration
async function searchWebTavily(query: string, apiKey: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout for search query
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: 3,
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return (data.results || [])
        .map((r: any) => `Source: ${r.title} (${r.url})\nContent: ${r.content}`)
        .join('\n\n');
    }
    return '';
  } catch (err: any) {
    console.warn('Tavily Search API warning:', err.message);
    return '';
  }
}

// Universal Model Caller
async function generateWithLLM(apiKey: string, prompt: string, timeout = 15000): Promise<string> {
  if (apiKey.startsWith('sk-')) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout); // use the passed timeout
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (e: any) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  // Google Gemini API Model Resolver
  const allowedModels: string[] = [];
  let listError = '';
  
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for listing models
    
    const listRes = await fetch(listUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (listRes.ok) {
      const listData = await listRes.json();
      const availableModels = listData.models || [];
      const priorityList = [
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-pro-latest',
        'gemini-2.5-pro'
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
    // Hardcoded fallback list if API resolver fails
    allowedModels.push('models/gemini-flash-latest', 'models/gemini-2.5-flash');
  }

  let generatedText = '';
  const errors: string[] = [];
  
  for (const model of allowedModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }, 3, 1500, timeout);

      if (response.ok) {
        const data = await response.json();
        generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (generatedText) {
          break;
        }
      } else {
        const errBody = await response.json().catch(() => ({}));
        const apiMessage = errBody?.error?.message || `HTTP Status ${response.status}`;
        errors.push(`${model} -> ${apiMessage}`);
      }
    } catch (e: any) {
      errors.push(`${model} -> ${e.message}`);
    }
  }

  if (!generatedText) {
    throw new Error(`Gemini API call failed. Diagnostics:\n${errors.map(err => `• ${err}`).join('\n')}`);
  }

  return generatedText;
}

export async function POST(req: Request) {
  try {
    const { apiKey, mode, topic, keywords, persona, tone, personalExperience, location, outline, searchEnabled } = await req.json();

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!activeApiKey) {
      return NextResponse.json({ error: 'API Key is required to run the AI Writer. Please configure GEMINI_API_KEY on the server or provide one in the browser.' }, { status: 400 });
    }

    // Fetch published articles from Sanity for internal linking
    let publishedPosts: { title: string; slug: string }[] = [];
    try {
      publishedPosts = await sanityClient.fetch(`*[_type == "post" && defined(slug.current)]{
        title,
        "slug": slug.current
      }`);
    } catch (e) {
      console.warn('Could not read published posts from Sanity:', e);
    }

    // Read local marketing and branding guidelines
    let marketingContext = '';
    let brandingContext = '';
    
    try {
      const pmPath = path.join(process.cwd(), '.agents/product-marketing.md');
      if (fs.existsSync(pmPath)) {
        marketingContext = fs.readFileSync(pmPath, 'utf8');
      }
    } catch (e) {}

    try {
      const bgPath = path.join(process.cwd(), '.agents/branding-guide.md');
      if (fs.existsSync(bgPath)) {
        brandingContext = fs.readFileSync(bgPath, 'utf8');
      }
    } catch (e) {}

    // Get location config database
    const normalizedLoc = (location || 'lovina').toLowerCase().trim();
    const locationData = LOCATION_DATABASES[normalizedLoc] || LOCATION_DATABASES.lovina;

    // Optional Search query retrieval
    let searchContext = '';
    const searchToken = process.env.TAVILY_API_KEY || (activeApiKey.startsWith('sk-') ? '' : process.env.TAVILY_API_KEY);
    if (searchEnabled && searchToken) {
      searchContext = await searchWebTavily(topic, searchToken);
    }

    // MODE: OUTLINE GENERATION
    if (mode === 'outline') {
      const outlinePrompt = `
You are an expert travel editor. Generate a highly detailed, logical outline for a 1,500+ word blog post about: "${topic}".
Focus keywords to cover: "${keywords}".
Traveler Persona: "${persona}".
Chosen region/location: "${location || 'Lovina'}".

Below is the brand guidelines context:
--- BRAND CONTEXT ---
${marketingContext}
${brandingContext}
----------------------

${searchContext ? `--- REAL-TIME SEARCH RESULTS --- \n${searchContext}\n---------------------------------\n` : ''}

Create exactly 5 to 6 distinct sections. Do NOT use H1 or H2 headings. Break the outline into H3 headings (e.g. ### Title) and a 1-sentence description of what should be covered.

Respond ONLY with a valid JSON array matching this format (no other text, no markdown code block backticks):
[
  {
    "heading": "### The Quiet 7:00 AM Departure: Why Timing is Everything",
    "description": "Explain why leaving at 7:00 AM avoids the standard sunrise boat rush, and sets a peaceful tone."
  }
]
`;
      const outlineRaw = await generateWithLLM(activeApiKey, outlinePrompt);
      const cleanedOutline = cleanJsonString(outlineRaw);
      try {
        const outlineJson = JSON.parse(cleanedOutline);
        return NextResponse.json({ outline: outlineJson });
      } catch (err: any) {
        console.error('Failed to parse outline JSON, raw text was:', outlineRaw);
        return NextResponse.json({ 
          error: 'Failed to generate a clean structured outline. Please try again.', 
          raw: outlineRaw 
        }, { status: 500 });
      }
    }

    // MODE: DRAFT GENERATION
    if (mode === 'draft') {
      if (!outline || !Array.isArray(outline) || outline.length === 0) {
        return NextResponse.json({ error: 'Outline parameter is required for draft mode.' }, { status: 400 });
      }

      const draftPrompt = `
You are an expert travel copywriter writing a comprehensive, high-quality, long-form travel guide.
Topic: "${topic}"
Current Location/Region: "${location || 'Lovina'}"
Traveler Persona: "${persona}"
Tone: "${tone}"

--- BRAND CONTEXT ---
${marketingContext}
${brandingContext}
----------------------

${searchContext ? `--- REAL-TIME SEARCH RESULTS --- \n${searchContext}\n---------------------------------\n` : ''}

--- TARGET ARTICLE OUTLINE ---
Please write the complete article covering all of these sections exactly in order:
${outline.map((s: any, idx: number) => `${idx + 1}. ${s.heading}\nDescription: ${s.description}`).join('\n\n')}

--- CONTENT REQUIREMENTS ---
1. Write a massive, engaging, highly detailed post of 1,500+ words. Do not write fluff; write concrete, rich paragraphs.
2. Incorporate these focus keywords naturally throughout the article: "${keywords}".
3. Weave in these personal travel experiences naturally if relevant: "${personalExperience || 'None provided.'}"
4. Align details with this location data:
   * Stays: ${locationData.stays.join(', ')}
   * Dining: ${locationData.dining.join(', ')}
   * Local info: ${locationData.details}
5. Optimize for AI search/citations (Perplexity, Google AIO): Under key sections, include bold 40-60 word "Answer Blocks" answering direct traveler questions.
6. Insert at least one detailed Markdown table comparing options or presenting data (e.g. routes, pricing, travel times).
7. Integrate internal links naturally to our published articles:
${publishedPosts.map((p: any) => `- Topic/Title: "${p.title}" -> Link: "/blog/${p.slug}"`).join('\n')}

--- FORMATTING & CRO REQUIREMENTS ---
8. Inject exactly 2 to 3 CRO Callout boxes placed naturally at logical transition points (e.g. at the end of a section discussing tours or waters).
   Format them exactly like this:
   :::cro-box
   ### Ready to Experience Lovina Beach?
   Skip the crowded sunrise chase. Book our private 7:00 AM Dolphin Watching Tour or Dolphin Watching + Snorkel Tour with vetted local captains. 
   [Book Your Private Boat Tour Now](/tours)
   :::
9. Insert 3 to 4 detailed Midjourney/Flux image prompts naturally between paragraphs.
   IMAGE PROMPT RULES (Crucial for location-specific realism):
   - Style: Use "candid travel documentary photography, 35mm film aesthetic, Kodak Portra 400 or Fujifilm Superia style, natural grain, soft shadows, realistic textures."
   - Avoid generic CGI buzzwords like "photorealistic", "hyperrealistic", or "cinematic".
   - Local realism: Describe exact Balinese features. For cars, use "white Toyota Innova or Avanza minivan" (never generic SUVs). For boats, use "traditional wooden outrigger boats with bamboo wings (jukung)". For lake views, use "deep emerald green water and low-hanging mountain mist". For scenery, incorporate "mossy Balinese roadside shrines wrapped in yellow cloth".
   Format them exactly like this:
   :::image-prompt
   **Midjourney Image Prompt:** [Prompt text describing the scene adhering to the realism rules] --ar 16:9
   :::
10. At the very end of the article, add a comprehensive FAQ section containing 3 to 4 questions based on the article's topic.
11. Finally, append the structured metadata block enclosed in [METADATA] and [/METADATA] tags.
Format:
[METADATA]
TAGS: tag1, tag2, tag3
TAKEAWAYS:
- Key takeaway 1
- Key takeaway 2
...
FAQS:
Q: Question 1?
A: Answer 1.
Q: Question 2?
A: Answer 2.
[/METADATA]

Return the complete blog post in markdown. Start directly with the main title H1 heading "# ...". Do not wrap the response in markdown code blocks like \`\`\`markdown.
`;

      const finalMarkdown = await generateWithLLM(activeApiKey, draftPrompt, 90000);

      // Parse structured metadata block from the generated text
      let tags: string[] = [];
      let keyTakeaways: string[] = [];
      let faqs: { question: string; answer: string }[] = [];
      let cleanMarkdown = finalMarkdown;

      const metadataMatch = finalMarkdown.match(/\[METADATA\]([\s\S]*?)\[\/METADATA\]/);
      if (metadataMatch) {
        const metaContent = metadataMatch[1];
        cleanMarkdown = finalMarkdown.replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '').trim();
        
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
    }

    return NextResponse.json({ error: 'Invalid mode parameter.' }, { status: 400 });
  } catch (err: any) {
    console.error('AI Generator Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred during blog generation.' }, { status: 500 });
  }
}
