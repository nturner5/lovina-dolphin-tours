import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// 1. Parse .env.local manually to ensure environment variables are populated
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[match[1].trim()] = val;
      }
    }
  }
} catch (e) {
  console.error('⚠️ Failed to parse .env.local:', e.message);
}

const activeApiKey = process.env.GEMINI_API_KEY;
const sanityToken = process.env.SANITY_AUTH_TOKEN;

if (!activeApiKey) {
  console.error('❌ Error: GEMINI_API_KEY is missing in .env.local.');
  process.exit(1);
}

if (!sanityToken) {
  console.error('❌ Error: SANITY_AUTH_TOKEN is missing in .env.local.');
  process.exit(1);
}

// 2. Initialize Sanity Client
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1f5xaxdl',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: sanityToken,
  apiVersion: '2024-05-26',
});

const generateKey = () => Math.random().toString(36).substring(2, 11);

// Helper to translate markdown to Sanity PortableText
function markdownToPortableText(markdownText) {
  const lines = markdownText.split('\n');
  const blocks = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check for headings
    if (line.startsWith('#### ')) {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h4',
        children: [{ _key: generateKey(), _type: 'span', text: line.substring(5) }],
        markDefs: [],
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h3',
        children: [{ _key: generateKey(), _type: 'span', text: line.substring(4) }],
        markDefs: [],
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h2',
        children: [{ _key: generateKey(), _type: 'span', text: line.substring(3) }],
        markDefs: [],
      });
    } else if (line.startsWith('# ')) {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h1',
        children: [{ _key: generateKey(), _type: 'span', text: line.substring(2) }],
        markDefs: [],
      });
    }
    // Check for bullet lists
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _key: generateKey(), _type: 'span', text: line.substring(2) }],
        markDefs: [],
      });
    }
    // Check for numbered lists
    else if (/^\d+\.\s+/.test(line)) {
      const text = line.replace(/^\d+\.\s+/, '');
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        listItem: 'number',
        children: [{ _key: generateKey(), _type: 'span', text: text }],
        markDefs: [],
      });
    }
    // Otherwise regular paragraph
    else {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        children: [{ _key: generateKey(), _type: 'span', text: line }],
        markDefs: [],
      });
    }
  }
  
  return blocks;
}

// Robust helper to perform fetch with automatic exponential retries on 503 (High Demand) status
async function fetchWithRetry(url, options, retries = 3, delay = 1500) {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 && i < retries - 1) {
        console.warn(`⚠️ Google Gemini returned 503 (High Demand). Retrying attempt ${i + 1}/${retries} in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 1.5;
        continue;
      }
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`⚠️ Network failure in fetch attempt ${i + 1}/${retries}. Retrying in ${currentDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= 1.5;
    }
  }
  throw new Error('Fetch failed after max retries.');
}

async function run() {
  console.log('🌴 Initializing Bali Dolphin Tours AI Blog Generator...');
  
  // Dynamic Model Resolver
  const allowedModels = [];
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeApiKey}`;
    const listRes = await fetch(listUrl);
    
    if (listRes.ok) {
      const listData = await listRes.json();
      const availableModels = listData.models || [];
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
        const found = availableModels.find(m => 
          m.name === `models/${priority}` && 
          m.supportedGenerationMethods?.includes('generateContent')
        );
        if (found) {
          allowedModels.push(found.name);
        }
      }
      
      if (allowedModels.length === 0 && availableModels.length > 0) {
        const fallback = availableModels.find(m => 
          m.supportedGenerationMethods?.includes('generateContent')
        );
        if (fallback) allowedModels.push(fallback.name);
      }
    }
  } catch (e) {
    console.warn('⚠️ Could not resolve models dynamically, using hardcoded priority cascade.', e.message);
  }

  if (allowedModels.length === 0) {
    allowedModels.push('models/gemini-3.5-flash', 'models/gemini-3-flash', 'models/gemini-2.5-flash', 'models/gemini-1.5-flash');
  }

  console.log(`🎯 Active Models Cascade: ${allowedModels.join(', ')}`);

  const topic = 'Where to Find the Best Linen Clothes in Bali: The Complete Shopping Guide';
  const keywords = "best linen clothes in Bali, Bali linen shops, men's linen clothes Bali, women's linen clothes Bali, linen clothing Seminyak, linen clothing Canggu, linen clothing Ubud";
  const persona = 'Aesthetic Traveler & Slow Fashion Advocate';
  const tone = 'Elegant, highly practical, editorial travel and fashion authority (styled like a luxury editorial)';

  const prompt = `
You are an elite travel writer and conversion rate optimization (CRO) expert. Your goal is to write a highly detailed, comprehensive, 1,500+ word "authority" travel blog post about the following topic:
Topic: "${topic}"
Target Focus Keywords (incorporate these naturally throughout the headings and body text): "${keywords}"
Target Traveler Persona: "${persona}"
Writing Tone: "${tone}"

Structure and formatting rules:
1. Editorial H1 Title: Create a high-click-through-rate, catchy title optimized for SEO at the very top (e.g. # Title).
2. Heading Structure: Break the article down into 5 to 6 comprehensive sections using detailed markdown headings (### H3 and #### H4). Do NOT use H1 or H2 in the body content (start headings at ### or #### to maintain correct SEO page hierarchy).
3. Highly Practical & Non-Fluff with Specific Restaurant & Hotel Recommendations & Links: Provide concrete travel information. Weave in very specific, real recommendations for local shopping, dining and boutique hotels. For every single shop, warung, or cafe you recommend, you MUST provide an actual descriptive markdown link (e.g. [Biasa Seminyak on Google Maps](https://maps.google.com/?q=Biasa+Linen+Seminyak+Bali)). Mention exact price ranges in both Indonesian Rupiah (IDR) and USD.
4. Call-to-Action (CRO) Callouts: Embed 2 to 3 beautiful CRO callout boxes that pitch Lovina Dolphin Watching Tours naturally at logical transition points (e.g., suggesting that a lightweight linen outfit is the ultimate comfortable, breathable choice for an ethical, early-morning private boat ride).
   Format them exactly like this in the markdown:
   :::cro-box
   ### Ready to Experience Lovina Beach?
   Skip the crowded sunrise chase. Dress in your breathable new Bali linens and book our private 7:00 AM Dolphin Watching Tour with vetted local captains. 
   [Book Your Private Boat Tour Now](/tours)
   :::
5. Advanced Photorealistic Image Prompts: Insert 3 to 4 detailed, photorealistic image prompts placed naturally between paragraphs where an image should go. These will serve as copy-paste prompts for Midjourney/Flux.
   Format: ":::image-prompt
   **Midjourney Image Prompt:** A photorealistic, cinematic shot of [description], captured on a Sony a7R V with a 50mm f/1.2 prime lens for dramatic depth-of-field, shutter speed 1/500s, volumetric morning sunbeams, Coastal Noir style with rich deep indigo and seafoam teal color grading, realistic skin textures, 8k resolution, --ar 16:9"
   :::
6. Comprehensive FAQ Section: Include a list of answers to common traveler concerns about buying linen in Bali at the end of the post.
7. Enriched Metadata Block: At the very end of your output, you MUST append a structured metadata block enclosed in [METADATA] and [/METADATA] tags. This metadata will be parsed by our backend to populate rich fields in our database. Do NOT output this block anywhere else or in any other format.
Format:
[METADATA]
TAGS: Linen, Shopping, Seminyak, Canggu, Ubud, Men's Fashion, Women's Fashion, Sustainable Fashion, Travel Guide
TAKEAWAYS:
- Key takeaway bullet point 1 (summarizing section 1)
- Key takeaway bullet point 2 (summarizing section 2)
- Key takeaway bullet point 3 (summarizing section 3)
- Key takeaway bullet point 4 (summarizing section 4)
- Key takeaway bullet point 5 (summarizing section 5)
FAQS:
Q: What is the average price of linen clothes in Bali?
A: High-end custom linen pieces at luxury boutiques cost between 1,200,000 IDR and 2,500,000 IDR ($80 - $170 USD), while boutique mid-range stores offer them for 600,000 IDR to 1,200,000 IDR ($40 - $80 USD).
Q: Is linen suitable for Bali's humidity?
A: Yes, natural linen is highly breathable, absorbs moisture, and dries quickly, making it the absolute best fabric to wear under Bali's tropical climate.
[/METADATA]

Write the entire, complete blog post in high-quality markdown, maintaining deep local context, slow-travel values, and the Coastal Noir luxury aesthetic. Do not summarize or abbreviate sections—write it in full. Let's cover Seminyak, Canggu, and Ubud. Make it highly engaging, practical, and editorial.
`;

  let generatedText = '';
  const errors = [];

  for (const model of allowedModels) {
    try {
      console.log(`📡 Sending request to Gemini via model: ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${activeApiKey}`;
      const response = await fetchWithRetry(url, {
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
          console.log(`✅ Success! Generated article content using ${model}`);
          break;
        }
      } else {
        const errBody = await response.json().catch(() => ({}));
        const apiMessage = errBody?.error?.message || `HTTP Status ${response.status}`;
        errors.push(`${model} -> ${apiMessage}`);
        console.warn(`   ⚠️ Model ${model} failed: ${apiMessage}. Trying fallback...`);
      }
    } catch (e) {
      errors.push(`${model} -> ${e.message}`);
      console.warn(`   ⚠️ Model ${model} threw error: ${e.message}. Trying fallback...`);
    }
  }

  if (!generatedText) {
    console.error('❌ Failed to generate blog content on all fallback models.', errors);
    process.exit(1);
  }

  // 3. Parse Metadata Block
  let tags = [];
  let keyTakeaways = [];
  let faqs = [];
  let cleanMarkdown = generatedText;

  const metadataMatch = generatedText.match(/\[METADATA\]([\s\S]*?)\[\/METADATA\]/);
  if (metadataMatch) {
    const rawMetadata = metadataMatch[1];
    cleanMarkdown = generatedText.replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '').trim();
    
    // Parse tags
    const tagsMatch = rawMetadata.match(/TAGS:\s*(.*)/i);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
    }
    
    // Parse takeaways
    const takeawaysMatch = rawMetadata.match(/TAKEAWAYS:\s*\n([\s\S]*?)(?:FAQS:|$)/i);
    if (takeawaysMatch) {
      keyTakeaways = takeawaysMatch[1]
        .split('\n')
        .map(l => l.trim().replace(/^-\s*/, ''))
        .filter(Boolean);
    }
    
    // Parse FAQs
    const faqsMatch = rawMetadata.match(/FAQS:\s*\n([\s\S]*?)$/i);
    if (faqsMatch) {
      const faqLines = faqsMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
      let currentFaq = null;
      for (const line of faqLines) {
        if (line.toUpperCase().startsWith('Q:')) {
          if (currentFaq) faqs.push(currentFaq);
          currentFaq = { question: line.replace(/^Q:\s*/i, '').trim(), answer: '' };
        } else if (line.toUpperCase().startsWith('A:') && currentFaq) {
          currentFaq.answer = line.replace(/^A:\s*/i, '').trim();
        } else if (currentFaq) {
          currentFaq.answer = (currentFaq.answer + ' ' + line).trim();
        }
      }
      if (currentFaq) faqs.push(currentFaq);
    }
  }

  // Parse Title and Excerpt
  const titleLine = cleanMarkdown.split('\n').find(l => l.trim().startsWith('# '));
  const postTitle = titleLine ? titleLine.replace('# ', '').trim() : topic;
  const postSlug = postTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  let excerpt = `Discover where to shop for the highest quality men's and women's linen clothes in Bali, complete with prices, shopping districts, and boutique maps.`;
  const firstParagraph = cleanMarkdown
    .split('\n')
    .map(line => line.trim())
    .find(line => line && !line.startsWith('#') && !line.startsWith(':') && !line.startsWith('*') && !/^\d+\./.test(line));
  
  if (firstParagraph) {
    excerpt = firstParagraph.substring(0, 160) + '...';
  }

  // 4. Assemble Sanity Post Document
  const postDoc = {
    _type: 'post',
    title: postTitle,
    slug: { _type: 'slug', current: postSlug },
    publishedAt: new Date().toISOString(),
    excerpt: excerpt,
    author: 'Bali Dolphin Tours Team',
    tags: tags.length > 0 ? tags : ['Linen', 'Shopping', 'Seminyak', 'Canggu', 'Ubud', 'Bali Guide'],
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : [
      'Linen is the most breathable, lightweight, and perfect attire for Bali\'s tropical climate.',
      'Seminyak houses upscale luxury resort wear, Canggu excels in bohemian everyday pieces, and Ubud is best for eco-conscious linen.',
      'Average prices range from 600,000 IDR to 2,500,000 IDR depending on high-end custom tailors vs mid-range boutiques.',
      'Wearing light, high-quality linen is highly recommended for a quiet, early morning private dolphin outrigger tour in Lovina.'
    ],
    faqs: faqs.map(f => ({
      _key: generateKey(),
      question: f.question,
      answer: f.answer
    })),
    body: markdownToPortableText(cleanMarkdown),
  };

  console.log(`📤 Pushing newly generated blog post to Sanity database...`);
  console.log(`📝 Title: "${postTitle}"`);
  console.log(`🔗 Slug: "${postSlug}"`);

  try {
    const result = await sanityClient.create(postDoc);
    console.log(`🎉 Success! Published to Sanity under Document ID: "${result._id}"`);
    console.log(`🚀 Live URL Path: /blog/${postSlug}`);
  } catch (err) {
    console.error('❌ Sanity creation failed:', err.message);
    process.exit(1);
  }
}

run();
