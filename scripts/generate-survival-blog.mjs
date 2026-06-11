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
      segments.push({
        text: text.substring(lastIndex, matchIndex),
        isLink: false
      });
    }
    
    segments.push({
      text: anchorText,
      isLink: true,
      href: linkUrl
    });
    
    lastIndex = linkRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isLink: false
    });
  }
  
  if (segments.length === 0) {
    segments.push({
      text: text,
      isLink: false
    });
  }
  
  for (const seg of segments) {
    const boldParts = seg.text.split('**');
    
    for (let i = 0; i < boldParts.length; i++) {
      const partText = boldParts[i];
      if (!partText) continue;
      
      const isBold = (i % 2 === 1);
      const marks = [];
      
      if (isBold) {
        marks.push('strong');
      }
      
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
    children.push({
      _key: generateKey(),
      _type: 'span',
      text: text
    });
  }
  
  return { children, markDefs };
}

// Helper to translate markdown to Sanity PortableText
function markdownToPortableText(markdownText) {
  const lines = markdownText.split('\n');
  const blocks = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check for headings
    if (line.startsWith('#### ')) {
      const { children, markDefs } = parseInlineFormatting(line.substring(5));
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h4',
        children,
        markDefs,
      });
    } else if (line.startsWith('### ')) {
      const { children, markDefs } = parseInlineFormatting(line.substring(4));
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h3',
        children,
        markDefs,
      });
    } else if (line.startsWith('## ')) {
      const { children, markDefs } = parseInlineFormatting(line.substring(3));
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h2',
        children,
        markDefs,
      });
    } else if (line.startsWith('# ')) {
      const { children, markDefs } = parseInlineFormatting(line.substring(2));
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h1',
        children,
        markDefs,
      });
    }
    // Check for bullet lists
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      const { children, markDefs } = parseInlineFormatting(line.substring(2));
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        children,
        markDefs,
      });
    }
    // Check for numbered lists
    else if (/^\d+\.\s+/.test(line)) {
      const rawText = line.replace(/^\d+\.\s+/, '');
      const { children, markDefs } = parseInlineFormatting(rawText);
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        listItem: 'number',
        children,
        markDefs,
      });
    }
    // Otherwise regular paragraph
    else {
      const { children, markDefs } = parseInlineFormatting(line);
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        children,
        markDefs,
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
  console.log('🌴 Initializing Bali Dolphin Tours AI Survival Guide Generator...');
  
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
    allowedModels.push('models/gemini-2.5-flash', 'models/gemini-1.5-flash');
  }

  const topic = 'Lovina Bali Travel Tips: ATMs, SIM Cards, Supermarkets & Cash (Local Survival Guide)';
  const keywords = 'Lovina Bali travel tips, is Lovina Bali safe, ATMs in Lovina, SIM card Lovina, supermarkets in Lovina, cash or card Lovina, Lovina medical clinics';
  const persona = 'Friendly Local Tour Operator and North Bali Insider';
  const tone = 'Warm, highly practical, reliable, direct, exciting, and simple';

  const prompt = `
You are an expert travel writer, local guide, and conversion rate optimization (CRO) expert. Write a highly detailed, comprehensive, 1,500+ word "authority" travel guide blog post about the following topic:
Topic: "${topic}"
Target Focus Keywords (incorporate these naturally throughout headings and body): "${keywords}"
Target Traveler Persona: "${persona}"
Writing Tone: "${tone}"

Specific Writing Instructions:
1. Editorial H1 Title: Create a catchy, SEO-optimized title at the very top (e.g. # Title).
2. Heading Structure: Break down the article into 5 to 6 comprehensive sections using detailed headings (### H3 and #### H4). Do NOT use H1 or H2 in the body content.
3. Practical Local Recommendations: Weave in realistic, highly specific local recommendations for Kalibukbuk (the main tourist hub of Lovina):
   - Mention the reliable ATMs on Jalan Raya Lovina (such as BNI, Mandiri, or Bank Central Asia - BCA) and warn about card skimmers at isolated ATMs.
   - Mention buying a Telkomsel tourist SIM card at local shops in Kalibukbuk, explaining the passport registration law.
   - Mention Pepito Supermarket Lovina for premium goods, sunscreen, and imported items, as well as Indomaret/Alfamart for daily basics.
   - Mention Lovina Medical Clinic as a reliable English-speaking clinic for "Bali belly" or prescriptions.
   - Detail why cash (Indonesian Rupiah - IDR) is absolute king, and that card payments are rarely accepted in local warungs or for beach activities.
4. Rules of Simplicity & Copy Rules:
   - Ditch complex jargon. Speak simply and directly.
   - Do NOT use pretentious terms. Keep it approachable, helpful, and down-to-earth.
   - Explain what a traditional boat is on first mention: "traditional wooden outrigger boat (called a jukung, which has long bamboo floaters on the sides so it cannot tip over)".
   - Explain dolphin viewing rules simply: keeping 30 meters distance, shutting motors down to neutral so the loud engine noise doesn't scare the dolphins, and never chasing or surrounding the pods.
5. Call-to-Action (CRO) Callouts: Embed 2 to 3 beautiful CRO callout boxes that pitch our 8:00 AM private ethical dolphin watching tour. Contrast the hot, loud, crowded 6:00 AM sunrise chase with our peaceful, late-departure 8:00 AM outrigger tour where the dolphins swim close out of curiosity because the ocean is empty and silent.
   Format:
   :::cro-box
   ### Ready to See Lovina's Dolphins Without the Noise?
   Avoid the early morning boat swarm and the pushy beach touts. Book our private, 100% ethical 8:00 AM Dolphin watching tour. Enjoy a peaceful, silent sea from a traditional wooden outrigger boat (jukung) with a vetted captain who respects the animals.
   [Book Your Private Ethical Encounter](/checkout)
   :::
6. Advanced Photorealistic Image Prompts: Insert 3 to 4 detailed image prompts placed naturally between paragraphs where an image should go.
   Format:
   :::image-prompt
   **Midjourney Image Prompt:** A photorealistic, cinematic shot of [description], captured on a Sony a7R V with a 50mm f/1.2 prime lens for dramatic depth-of-field, shutter speed 1/500s, volumetric morning sunbeams, Coastal Noir style with rich deep indigo and seafoam teal color grading, realistic skin textures, 8k resolution, --ar 16:9
   **SEO Alt Text:** [Highly descriptive, keyword-rich alt text for search engine optimization]
   **Caption:** [A friendly, editorial caption to display beneath the image]
   :::
7. Comprehensive FAQ Section: Include a list of answers to common traveler concerns about Lovina logistics at the end of the post.
8. Enriched Metadata Block: Append a structured metadata block enclosed in [METADATA] and [/METADATA] tags at the very end.
   Format:
   [METADATA]
   TAGS: Lovina, Travel Tips, Bali Guide, Survival Guide, ATMs Lovina, SIM Card Bali, Safety Bali
   TAKEAWAYS:
   - Key takeaway bullet point 1
   - Key takeaway bullet point 2
   - Key takeaway bullet point 3
   - Key takeaway bullet point 4
   - Key takeaway bullet point 5
   FAQS:
   - Q & A list matching the FAQs
   [/METADATA]

Write the entire, complete blog post in high-quality markdown, keeping local context accurate and emphasizing slow-travel values. Do not summarize or abbreviate sections—write it in full.
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
        if (line.toUpperCase().startsWith('Q:') || line.startsWith('- Q:')) {
          if (currentFaq) faqs.push(currentFaq);
          const cleanQ = line.replace(/^-?\s*Q:\s*/i, '').trim();
          currentFaq = { question: cleanQ, answer: '' };
        } else if ((line.toUpperCase().startsWith('A:') || line.startsWith('- A:')) && currentFaq) {
          const cleanA = line.replace(/^-?\s*A:\s*/i, '').trim();
          currentFaq.answer = cleanA;
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

  let excerpt = `Get all the essential travel and survival tips for Lovina Beach, North Bali. We cover cash vs card, reliable ATMs, supermarkets, SIM cards, and local safety rules.`;
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
    tags: tags.length > 0 ? tags : ['Lovina', 'Travel Guide', 'Bali Guide', 'Survival Guide', 'Local Tips'],
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : [
      'Cash (IDR) is king in Lovina—most restaurants and local activities do not take credit cards.',
      'Only use secure, well-lit ATMs at major banks on the main street to avoid card skimming.',
      'Buy a Telkomsel SIM card at official local shops in Kalibukbuk, and remember to register it with your passport.',
      'Pepito Supermarket is the best place in Lovina for imported goods, sunscreen, and premium supplies.',
      'Lovina is exceptionally safe, and a polite but firm "no, thank you" is all you need to handle local beach touts.'
    ],
    faqs: faqs.map(f => ({
      _key: generateKey(),
      question: f.question,
      answer: f.answer
    })),
    body: markdownToPortableText(cleanMarkdown),
  };

  console.log(`📤 Pushing newly generated survival guide to Sanity database...`);
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
