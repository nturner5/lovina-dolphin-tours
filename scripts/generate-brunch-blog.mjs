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

// Robust helper to perform fetch with retries on 503
async function fetchWithRetry(url, options, retries = 3, delay = 1500) {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 && i < retries - 1) {
        console.warn(`⚠️ Google Gemini returned 503. Retrying attempt ${i + 1}/${retries} in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 1.5;
        continue;
      }
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`⚠️ Network failure. Retrying in ${currentDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= 1.5;
    }
  }
  throw new Error('Fetch failed after max retries.');
}

async function run() {
  console.log('🌴 Initializing Bali Dolphin Tours AI Brunch Guide Generator...');
  
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
        if (found) allowedModels.push(found.name);
      }
    }
  } catch (e) {
    console.warn('⚠️ Dynamic resolver warning:', e.message);
  }

  if (allowedModels.length === 0) {
    allowedModels.push('models/gemini-3.5-flash', 'models/gemini-2.5-flash', 'models/gemini-1.5-flash');
  }

  const topic = 'The Ultimate Canggu Brunch Guide: Famous Institutions & Quiet Hidden Gems';
  const keywords = 'best brunch spots in Canggu, Canggu breakfast cafes, eggs benedict Canggu, hidden gem cafes Bali, Crate Cafe Canggu, Milk and Madu Berawa, Sensorium Canggu';
  const persona = 'Local Travel Designer & Culinary Curator';
  const tone = 'Sophisticated yet highly personal and warm, editorially styled with actual food-critic anecdotes and authentic quotes';

  const prompt = `
You are an elite travel writer, food critic, and conversion rate optimization (CRO) expert. Write a highly detailed, comprehensive, 1,500+ word "authority" travel and food blog post about the following topic:
Topic: "${topic}"
Target Focus Keywords (incorporate these naturally throughout headings and body): "${keywords}"
Target Traveler Persona: "${persona}"
Writing Tone: "${tone}"

Specific Writing Instructions:
1. Editorial H1 Title: Create a high-click-through-rate, catchy title optimized for SEO at the very top (e.g. # Title).
2. Heading Structure: Break down into 5 to 6 comprehensive sections using detailed markdown headings (### H3 and #### H4). Do NOT use H1 or H2 in the body content.
3. Personal Experience & Anecdotes: Weave in realistic, first-hand culinary critiques. Speak directly about the food with raw personality:
   - "I always get the eggs bennie at Milk & Madu and am never disappointed—the hollandaise has just the right amount of citrus tang, and the spinach is perfectly wilted on their house-made sourdough."
   - "At Crate Cafe, the queue can look intimidating, but it moves fast. Order the 'Why Not' or 'Vador'—you get massive plates of fresh avo, poached eggs, and bacon for a fraction of Western prices."
   - "For a quiet, crowd-free morning, we sneak into ZIN Cafe. The bamboo architecture makes you feel like you're in Ubud, and their house-roasted coffee is some of the best on Jalan Nelayan."
4. Highly Practical & Real Shop Recommendations: Feature highly rated institutions (Crate Cafe, Milk & Madu, Sensorium, Shady Shack) AND lesser-known hidden gems (Zin Cafe, Satu-Satu Coffee Company, Rider Cafe). For every single cafe, provide a descriptive markdown link to their actual Google Maps coordinates (e.g. [Milk & Madu Berawa on Google Maps](https://maps.google.com/?q=Milk+and+Madu+Berawa+Canggu)). Indicate exact pricing in both IDR and USD.
5. Call-to-Action (CRO) Callouts: Embed 2 to 3 beautiful CRO callout boxes that pitch Lovina Dolphin Watching Tours naturally at logical transition points (e.g., contrast Canggu's crowded brunch waiting lines with the quiet, peaceful empty ocean of North Bali on a private 7:00 AM dolphin watching outrigger).
   Format:
   :::cro-box
   ### Tired of the Canggu Cafe Queues?
   Escape the crowds for a weekend. Dress in your breathable resort linens and book our private, ethical 7:00 AM Dolphin Watching Tour in Lovina. Enjoy an empty, silent ocean while the Spinner dolphins play right next to your boat. 
   [Book Your Private Quiet Encounter Now](/tours)
   :::
6. Advanced Photorealistic Image Prompts: Insert 3 to 4 detailed image prompts placed naturally between paragraphs.
   Format:
   :::image-prompt
   **Midjourney Image Prompt:** A photorealistic, cinematic shot of [description], captured on a Sony a7R V with a 50mm f/1.2 prime lens for dramatic depth-of-field, shutter speed 1/500s, volumetric morning sunbeams, Coastal Noir style with rich deep indigo and seafoam teal color grading, realistic skin textures, 8k resolution, --ar 16:9
   :::
7. Comprehensive FAQ Section: Include a list of answers to common traveler concerns about dining in Canggu at the end of the post.
8. Enriched Metadata Block: Append a structured metadata block enclosed in [METADATA] and [/METADATA] tags at the very end.
Format:
[METADATA]
TAGS: Canggu, Brunch, Breakfast, Cafes, Food Guide, Bali Food, Hidden Gems, Sustainable Tourism
TAKEAWAYS:
- Key takeaway bullet point 1
- Key takeaway bullet point 2
- Key takeaway bullet point 3
- Key takeaway bullet point 4
- Key takeaway bullet point 5
FAQS:
Q: What is the average price of breakfast in Canggu?
A: A high-quality brunch dish with a specialty coffee typically costs between 100,000 IDR and 180,000 IDR ($7 - $12 USD), making it exceptionally reasonable compared to Western cities.
Q: Which Canggu cafe has the best coffee?
A: ZIN Cafe and Satu-Satu Coffee Company are highly regarded for their house-roasted, locally sourced Balinese single-origin beans.
[/METADATA]

Write the entire, complete blog post in high-quality markdown, maintaining deep local context, slow-travel values, and the Coastal Noir luxury aesthetic. Do not summarize or abbreviate sections—write it in full.
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
          generationConfig: { temperature: 0.7 },
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
    
    const tagsMatch = rawMetadata.match(/TAGS:\s*(.*)/i);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
    }
    
    const takeawaysMatch = rawMetadata.match(/TAKEAWAYS:\s*\n([\s\S]*?)(?:FAQS:|$)/i);
    if (takeawaysMatch) {
      keyTakeaways = takeawaysMatch[1]
        .split('\n')
        .map(l => l.trim().replace(/^-\s*/, ''))
        .filter(Boolean);
    }
    
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

  let excerpt = `Discover the ultimate Canggu brunch guide featuring famous institutions like Crate Cafe and Milk & Madu, alongside quiet hidden gem cafes.`;
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
    tags: tags.length > 0 ? tags : ['Canggu', 'Brunch', 'Breakfast', 'Food Guide', 'Bali Guide'],
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : [
      'Crate Cafe is an institution offering massive portions at incredible budget-friendly prices.',
      'Milk & Madu serves a legendary eggs benedict on house-made sourdough in a lively Berawa lawn setting.',
      'ZIN Cafe is a gorgeous bamboo co-working oasis near Nelayan Beach with exceptional coffee and no tourist swarms.',
      'Satu-Satu Coffee Company provides ultra-authentic, estate-grown Balinese coffee at local prices.',
      'Escaping the Canggu brunch queues for a peaceful, empty ocean weekend in Lovina offers the ultimate slow-travel contrast.'
    ],
    faqs: faqs.map(f => ({
      _key: generateKey(),
      question: f.question,
      answer: f.answer
    })),
    body: markdownToPortableText(cleanMarkdown),
  };

  console.log(`📤 Pushing newly generated brunch guide to Sanity database...`);
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
