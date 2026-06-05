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
  console.log('🌴 Initializing Bali Dolphin Tours AI Restaurant Guide Generator...');
  
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

  const topic = 'The Quiet Culinary Capital: The Ultimate Lovina Restaurant Guide to Slow-Travel Fine Dining & Authentic Warungs';
  const keywords = 'best restaurants in Lovina, where to eat in Lovina, Lovina dining guide, Tanda Pizza Lovina, Warung Apple Lovina, Warung Ayu Lovina, Warung Nemo Lovina, The Damai Lovina, best pizza Lovina';
  const persona = 'Local North Bali Travel Designer & Slow-Food Advocate';
  const tone = 'Sophisticated, sensory, highly personal, warm, and editorially pristine (Coastal Noir style)';

  const prompt = `
You are an elite travel writer, food critic, and conversion rate optimization (CRO) expert. Write a highly detailed, comprehensive, 1,500+ word "authority" travel and food blog post about the following topic:
Topic: "${topic}"
Target Focus Keywords (incorporate these naturally throughout headings and body): "${keywords}"
Target Traveler Persona: "${persona}"
Writing Tone: "${tone}"

Specific Writing Instructions:
1. Editorial H1 Title: Create a high-click-through-rate, catchy title optimized for SEO at the very top (e.g. # Title).
2. Heading Structure: Break down into 6 comprehensive sections using detailed markdown headings (### H3 and #### H4). Do NOT use H1 or H2 in the body content.
3. Personal Experience & Anecdotes: Weave in realistic, first-hand culinary critiques. Speak directly about the food with raw personality:
   - **Tanda Pizza (Italian Gem):** Describe our personal critique of Tanda Pizza on Jalan Pandawa in Kaliasem. Praise the authentic Sardinian wood-fired brick oven and the peaceful garden and rice paddy backdrop. Describe the **pillow-soft texture of their four-cheese gnocchi** (hands down the best Italian food outside of Italy) and their incredible wood-fired **pizza topped with fresh arugula and a giant, liquidy Burrata cheese ball** right in the middle that cascades luxuriously when cut open. Weave in how the friendly Italian owner personally comes out to greet you, make sure you enjoy the food, and offer a shot of house-made **Limoncello** at the end.
   - **The Damai Restaurant (Hillside Fine Dining):** Detail the organic farm-to-table French-Asian fusion, highlighting fresh ingredients hand-harvested from the resort's own organic vegetable patches. Describe the pool-lit ambiance and spectacular views of the sunset lighting up volcanoes in East Java.
   - **AKAR Cafe Lovina (Sanctuary):** Detail the healthy organic menu, artisanal smoothie bowls, vegan wraps, and premium double-shot espresso in their beautiful bohemian bamboo sanctuary.
   - **Warung Apple (Family-Run Kitchen):** Detail the homey, intimate atmosphere where you enter as guests and leave as family, serving a Nasi Campur that blows you away.
   - **Warung Ayu (Heritage Authority):** Focus on traditional, slow-cooked Balinese heritage recipes like Ayam Betutu (spiced chicken slow-steamed in banana leaves) with their complex, house-ground *basa gede* spice paste.
   - **Warung Nemo (Beachfront Grill):** Highlight the casual feet-in-the-sand tables where fresh-caught Red Snapper or Mahi-Mahi is grilled over dry coconut husks and basted in chili-garlic-butter, paired with a cold Bintang at sunset.
4. Highly Practical & Real Shop Recommendations: Feature all 6 dining locations. For every single cafe or restaurant, provide a descriptive markdown link to their actual Google Maps coordinates exactly as follows:
   - [Tanda Pizza Kaliasem on Google Maps](https://www.google.com/maps/search/?api=1&query=Tanda+Pizza+Kaliasem+Lovina)
   - [The Damai Restaurant on Google Maps](https://www.google.com/maps/search/?api=1&query=The+Damai+Restaurant+Lovina)
   - [AKAR Cafe Lovina on Google Maps](https://www.google.com/maps/search/?api=1&query=AKAR+Cafe+Lovina)
   - [Warung Apple Lovina on Google Maps](https://www.google.com/maps/search/?api=1&query=Warung+Apple+Lovina)
   - [Warung Ayu on Google Maps](https://www.google.com/maps/search/?api=1&query=Warung+Ayu+Lovina)
   - [Warung Nemo Lovina on Google Maps](https://www.google.com/maps/search/?api=1&query=Warung+Nemo+Lovina)
   Indicate exact pricing in both IDR and USD for each restaurant to be factually helpful.
5. Call-to-Action (CRO) Callouts: Embed 2 to 3 beautiful CRO callout boxes that pitch Lovina Dolphin Watching & Snorkeling Tours naturally at logical transition points (e.g., contrasting Canggu's crowded brunch waiting lines with the quiet, peaceful empty ocean of North Bali on a private 7:00 AM dolphin watching outrigger).
   Format:
   :::cro-box
   ### Tired of the Southern Chaos?
   Escape the crowded beaches for a weekend. Dress in your breathable resort linens and book our private, ethical 7:00 AM Dolphin Watching & Snorkeling Tour in Lovina. Experience an empty, silent ocean while the Spinner dolphins play right next to your boat. 
   [Book Your Private Quiet Encounter Now](/tours)
   :::
6. Advanced Photorealistic Image Prompts: Insert 3 to 4 detailed image prompts placed naturally between paragraphs.
   Format:
   :::image-prompt
   **Midjourney Image Prompt:** A photorealistic, cinematic shot of [description], captured on a Sony a7R V with a 50mm f/1.2 prime lens for dramatic depth-of-field, shutter speed 1/500s, volumetric morning sunbeams, Coastal Noir style with rich deep indigo and seafoam teal color grading, realistic skin textures, 8k resolution, --ar 16:9
   :::
7. Comprehensive FAQ Section: Include a list of answers to common traveler concerns about dining in Lovina at the end of the post.
8. Enriched Metadata Block: Append a structured metadata block enclosed in [METADATA] and [/METADATA] tags at the very end.
Format:
[METADATA]
TAGS: Lovina, Restaurant Guide, Food Guide, Bali Food, Fine Dining, Italian Food Bali, Authentic Warungs, Slow Travel
TAKEAWAYS:
- Tanda Pizza serves the best Sardinian wood-fired pizza and pillow-soft four-cheese gnocchi in North Bali.
- The Damai Restaurant offers hillside organic farm-to-table fine dining with sunset volcanic views.
- AKAR Cafe Lovina is the primary boutique sanctuary for healthy, plant-based dining and specialty espresso.
- Warung Apple and Warung Ayu represent heritage Balinese slow-cooking at its absolute best.
- Warung Nemo offers beachfront, feet-in-the-sand coconut husk seafood grilling.
FAQS:
Q: What is the average price of a meal in Lovina?
A: Local warung dishes range from 30,000 to 60,000 IDR ($2 - $4 USD), while boutique and specialized restaurants cost between 80,000 and 180,000 IDR ($5 - $12 USD), offering incredible value.
Q: Are credit cards widely accepted in Lovina restaurants?
A: Mid-to-high-end restaurants (like Tanda Pizza and The Damai) accept international credit cards (Visa/Mastercard), while smaller local warungs (like Warung Apple and Warung Nemo) require Indonesian Rupiah (IDR) cash.
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

  let excerpt = `Discover the ultimate Lovina restaurant guide featuring slow-travel hillside fine dining, authentic beachfront grills, and the best wood-fired pizza and pasta.`;
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
    tags: tags.length > 0 ? tags : ['Lovina', 'Restaurant Guide', 'Bali Food', 'Fine Dining', 'Local Warungs'],
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : [
      'Tanda Pizza serves the best Sardinian wood-fired pizza and pillow-soft four-cheese gnocchi in North Bali.',
      'The Damai Restaurant offers hillside organic farm-to-table fine dining with sunset volcanic views.',
      'AKAR Cafe Lovina is the primary boutique sanctuary for healthy, plant-based dining and specialty espresso.',
      'Warung Apple and Warung Ayu represent heritage Balinese slow-cooking at its absolute best.',
      'Warung Nemo offers beachfront, feet-in-the-sand coconut husk seafood grilling.'
    ],
    faqs: faqs.map(f => ({
      _key: generateKey(),
      question: f.question,
      answer: f.answer
    })),
    body: markdownToPortableText(cleanMarkdown),
  };

  console.log(`📤 Pushing newly generated restaurant guide to Sanity database...`);
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
