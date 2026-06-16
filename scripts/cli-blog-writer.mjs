import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import https from 'https';

// 1. Load env vars manually from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let keys = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      keys[name] = val;
    }
  });
}

const activeApiKey = keys.GEMINI_API_KEY;
const sanityToken = keys.SANITY_AUTH_TOKEN;

if (!activeApiKey || !sanityToken) {
  console.error('❌ Error: GEMINI_API_KEY or SANITY_AUTH_TOKEN is missing in .env.local.');
  process.exit(1);
}

// 2. Initialize Sanity Client
const sanityClient = createClient({
  projectId: keys.NEXT_PUBLIC_SANITY_PROJECT_ID || '1f5xaxdl',
  dataset: keys.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: sanityToken,
  apiVersion: '2024-05-26',
});

// Helper to parse command line arguments
function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return null;
}

const topic = getArg('--topic') || getArg('-t');
const keywords = getArg('--keywords') || getArg('-k');
const personalExperience = getArg('--experience') || getArg('-e') || '';
const location = getArg('--location') || getArg('-l') || 'lovina';
let slug = getArg('--slug') || getArg('-s');

if (!topic || !keywords) {
  console.log(`
📖 Lovina CLI Blog Writer Usage:
  node scripts/cli-blog-writer.mjs -t "<topic>" -k "<keywords>" [options]

Options:
  -t, --topic       The H1 title / topic of the blog post (Required)
  -k, --keywords    Comma-separated SEO focus keywords (Required)
  -e, --experience  Personal EEAT experiences to weave in (Optional)
  -l, --location    Target location: lovina, uluwatu, ubud, canggu, munduk (Default: lovina)
  -s, --slug        Sanity URL slug (Optional, auto-generated if omitted)
  `);
  process.exit(0);
}

// Slugify topic if not provided
if (!slug) {
  slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const generateKey = () => Math.random().toString(36).substring(2, 11);

// Location config database
const LOCATION_DATABASES = {
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
    details: "Ubud is the cultural heart of Bali. Private drivers pick up guests at ~4:30 AM for a round-trip Lovina dolphin excursion."
  }
};

const locationData = LOCATION_DATABASES[location.toLowerCase()] || LOCATION_DATABASES.lovina;

// Standard HTTPS post helper to bypass Node v18.0.0 experimental fetch bugs
function httpsPost(url, data, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: timeoutMs
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(body),
            text: async () => body
          });
        });
      });
      
      req.on('error', (e) => { reject(e); });
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeoutMs / 1000}s`));
      });
      
      req.write(postData);
      req.end();
    } catch (err) { reject(err); }
  });
}

// Robust fetch helper with exponential retries on 503
async function fetchWithRetry(url, options, retries = 3, delay = 1500, timeout = 15000) {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const requestBody = options.body ? JSON.parse(options.body) : {};
      const response = await httpsPost(url, requestBody, timeout);

      if (response.status === 503 && i < retries - 1) {
        console.warn(`⚠️ Google Gemini returned 503 (High Demand). Retrying attempt ${i + 1}/${retries} in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 1.5;
        continue;
      }
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`⚠️ Network failure in fetch attempt ${i + 1}/${retries} (${e.message}). Retrying in ${currentDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= 1.5;
    }
  }
  throw new Error('Fetch failed after max retries.');
}

// Model Caller
async function generateWithLLM(apiKey, prompt, timeout = 15000) {
  const allowedModels = [
    'models/gemini-flash-latest',
    'models/gemini-2.5-flash',
    'models/gemini-pro-latest',
    'models/gemini-2.5-pro'
  ];

  let generatedText = '';
  const errors = [];
  
  for (const model of allowedModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }, 3, 1500, timeout);

      if (response.ok) {
        const data = await response.json();
        generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (generatedText) break;
      } else {
        const errBody = await response.json().catch(() => ({}));
        const apiMessage = errBody?.error?.message || `HTTP Status ${response.status}`;
        errors.push(`${model} -> ${apiMessage}`);
      }
    } catch (e) {
      errors.push(`${model} -> ${e.message}`);
    }
  }

  if (!generatedText) {
    throw new Error(`Gemini API call failed. Diagnostics:\n${errors.map(err => `• ${err}`).join('\n')}`);
  }

  return generatedText;
}

// Clean JSON response block from markdown tags
function cleanJsonString(str) {
  return str
    .replace(/^```json/i, '')
    .replace(/^```/m, '')
    .replace(/```$/m, '')
    .trim();
}

function parseInlineFormatting(text) {
  const children = [];
  const markDefs = [];
  
  const segments = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    const anchorText = match[1];
    const linkUrl = match[2];
    
    if (matchIndex > lastIndex) {
      segments.push({ text: text.substring(lastIndex, matchIndex), isLink: false });
    }
    segments.push({ text: anchorText, isLink: true, href: linkUrl });
    lastIndex = linkRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), isLink: false });
  }
  
  if (segments.length === 0) {
    segments.push({ text: text, isLink: false });
  }
  
  for (const seg of segments) {
    const boldParts = seg.text.split('**');
    
    for (let i = 0; i < boldParts.length; i++) {
      const partText = boldParts[i];
      if (!partText) continue;
      
      const isBold = (i % 2 === 1);
      const marks = [];
      
      if (isBold) marks.push('strong');
      
      if (seg.isLink) {
        const markKey = generateKey();
        marks.push(markKey);
        
        children.push({
          _key: generateKey(),
          _type: 'span',
          text: partText,
          marks
        });
        
        markDefs.push({
          _key: markKey,
          _type: 'link',
          href: seg.href
        });
      } else {
        children.push({
          _key: generateKey(),
          _type: 'span',
          text: partText,
          marks: marks.length > 0 ? marks : undefined
        });
      }
    }
  }
  
  if (children.length === 0) {
    children.push({ _key: generateKey(), _type: 'span', text: text });
  }
  
  return { children, markDefs };
}

function markdownToPortableText(markdownText) {
  const lines = markdownText.split('\n');
  const blocks = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line.startsWith('#### ')) {
      const text = line.substring(5);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({ _key: generateKey(), _type: 'block', style: 'h4', children, markDefs });
    } else if (line.startsWith('### ')) {
      const text = line.substring(4);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({ _key: generateKey(), _type: 'block', style: 'h3', children, markDefs });
    } else if (line.startsWith('## ')) {
      const text = line.substring(3);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({ _key: generateKey(), _type: 'block', style: 'h2', children, markDefs });
    } else if (line.startsWith('# ')) {
      const text = line.substring(2);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({ _key: generateKey(), _type: 'block', style: 'h1', children, markDefs });
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      const text = line.substring(2);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({ _key: generateKey(), _type: 'block', style: 'normal', listItem: 'bullet', children, markDefs });
    } else if (/^\d+\.\s+/.test(line)) {
      const text = line.replace(/^\d+\.\s+/, '');
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({ _key: generateKey(), _type: 'block', style: 'normal', listItem: 'number', children, markDefs });
    } else {
      const { children, markDefs } = parseInlineFormatting(line);
      blocks.push({ _key: generateKey(), _type: 'block', style: 'normal', children, markDefs });
    }
  }
  
  return blocks;
}

async function main() {
  console.log(`🌴 Starting CLI Blog Generation: "${topic}"...`);
  
  // A. Fetch Sanity posts for internal linking
  let publishedPosts = [];
  try {
    publishedPosts = await sanityClient.fetch(`*[_type == "post" && defined(slug.current)]{
      title,
      "slug": slug.current
    }`);
    console.log(`✅ Loaded ${publishedPosts.length} published posts for linking map.`);
  } catch (e) {
    console.warn('⚠️ Could not load link maps:', e.message);
  }

  // B. Load marketing rules
  let marketingContext = '';
  let brandingContext = '';
  try {
    marketingContext = fs.readFileSync('.agents/product-marketing.md', 'utf8');
    brandingContext = fs.readFileSync('.agents/branding-guide.md', 'utf8');
  } catch (e) {}

  // 1. Generate Outline
  console.log('\n🚀 Step 1: Requesting Outline from Gemini...');
  const outlinePrompt = `
You are an expert travel editor. Generate a highly detailed, logical outline for a 1,500+ word blog post about: "${topic}".
Focus keywords to cover: "${keywords}".
Traveler Persona: "Conscious Explorer".
Chosen region/location: "${location}".

Below is the brand guidelines context:
--- BRAND CONTEXT ---
${marketingContext}
${brandingContext}
----------------------

Create exactly 5 to 6 distinct sections. Do NOT use H1 or H2 headings. Break the outline into H3 headings (e.g. ### Title) and a 1-sentence description of what should be covered.

Respond ONLY with a valid JSON array matching this format (no other text, no markdown code block backticks):
[
  {
    "heading": "### The Quiet 7:00 AM Departure: Why Timing is Everything",
    "description": "Explain why leaving at 7:00 AM avoids the standard sunrise boat rush, and sets a peaceful tone."
  }
]
`;
  const outlineRaw = await generateWithLLM(activeApiKey, outlinePrompt, 30000);
  const cleanedOutline = cleanJsonString(outlineRaw);
  let outline = [];
  try {
    outline = JSON.parse(cleanedOutline);
    console.log(`✅ Outline generated successfully! Found ${outline.length} sections:`);
    outline.forEach((sec, i) => console.log(`  ${i+1}. ${sec.heading} (${sec.description})`));
  } catch (err) {
    console.error('❌ Failed to parse outline JSON. Raw response was:', outlineRaw);
    process.exit(1);
  }

  // 2. Generate Draft
  console.log('\n🚀 Step 2: Generating complete draft from Gemini (Single-Pass)...');
  console.log('⌛ This will take 20-30 seconds. Please wait...');

  const draftPrompt = `
You are an expert travel copywriter writing a comprehensive, high-quality, long-form travel guide.
Topic: "${topic}"
Current Location/Region: "${location}"
Traveler Persona: "Conscious Explorer"
Tone: "Finns-style Travel Authority"

--- BRAND CONTEXT ---
${marketingContext}
${brandingContext}
----------------------

--- TARGET ARTICLE OUTLINE ---
Please write the complete article covering all of these sections exactly in order:
${outline.map((s, idx) => `${idx + 1}. ${s.heading}\nDescription: ${s.description}`).join('\n\n')}

--- CONTENT REQUIREMENTS ---
1. Write a massive, engaging, highly detailed post of 1,500+ words. Do not write fluff; write concrete, rich paragraphs.
2. Incorporate these focus keywords naturally throughout the article: "${keywords}".
3. Weave in these personal travel experiences naturally if relevant: "${personalExperience}"
4. Align details with this location data:
   * Stays: ${locationData.stays.join(', ')}
   * Dining: ${locationData.dining.join(', ')}
   * Local info: ${locationData.details}
5. Optimize for AI search/citations (Perplexity, Google AIO): Under key sections, include bold 40-60 word "Answer Blocks" answering direct traveler questions.
6. Insert at least one detailed Markdown table comparing options or presenting data (e.g. routes, pricing, travel times).
7. Integrate internal links naturally to our published articles:
${publishedPosts.map(p => `- Topic/Title: "${p.title}" -> Link: "/blog/${p.slug}"`).join('\n')}

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
  console.log('✅ Draft generated successfully! Parsing metadata...');

  // Parse structured metadata block
  let tags = [];
  let keyTakeaways = [];
  let faqs = [];
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
      let currentFaq = null;
      
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

  console.log(`\n🚀 Step 3: Pushing draft directly to Sanity CMS under slug "${slug}"...`);

  const postDoc = {
    _type: 'post',
    title: topic,
    slug: { _type: 'slug', current: slug },
    publishedAt: new Date().toISOString(),
    excerpt: `Explore ${topic} with Bali Dolphin Tours's expert travel guide.`,
    author: 'Bali Dolphin Tours Team',
    tags,
    keyTakeaways,
    faqs: faqs.map(f => ({
      _key: generateKey(),
      question: f.question,
      answer: f.answer
    })),
    body: markdownToPortableText(cleanMarkdown),
  };

  try {
    const result = await sanityClient.create(postDoc);
    console.log(`✅ Success! Published to Sanity. Document ID: "${result._id}"`);
  } catch (err) {
    console.error('❌ Direct Sanity write failed:', err.message);
    process.exit(1);
  }

  // 4. Generate images
  console.log('\n🚀 Step 4: Launching Imagen-4 Blog Image Generator...');
  try {
    console.log(`Executing: node scripts/generate-blog-images.mjs ${slug}`);
    const output = execSync(`node scripts/generate-blog-images.mjs ${slug}`, { encoding: 'utf8' });
    console.log(output);
    console.log('🎉 Direct generation and publish process is complete!');
  } catch (err) {
    console.error('❌ Image generation task failed:', err.message);
  }
}

main();
