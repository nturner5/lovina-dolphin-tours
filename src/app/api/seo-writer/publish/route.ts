import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1f5xaxdl',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-05-26',
});

const generateKey = () => Math.random().toString(36).substring(2, 11);

// Robust parser to scan a string for both markdown links [Anchor Text](URL) and double asterisks **bold** formatting, compiling them jointly into structured spans and mark definitions
function parseInlineFormatting(text: string) {
  const children: any[] = [];
  const markDefs: any[] = [];
  
  // 1. Identify all markdown link segments
  const segments: { text: string; isLink: boolean; href?: string }[] = [];
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
  
  // 2. Loop over segments and parse double asterisks bold text (**bold**)
  for (const seg of segments) {
    const boldParts = seg.text.split('**');
    
    for (let i = 0; i < boldParts.length; i++) {
      const partText = boldParts[i];
      if (!partText) continue;
      
      const isBold = (i % 2 === 1);
      const marks: string[] = [];
      
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

// Robust markdown line parser to compile paragraphs, lists, and headings into standard Sanity PortableText
function markdownToPortableText(markdownText: string) {
  const lines = markdownText.split('\n');
  const blocks: any[] = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check for headings
    if (line.startsWith('#### ')) {
      const text = line.substring(5);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h4',
        children,
        markDefs,
      });
    } else if (line.startsWith('### ')) {
      const text = line.substring(4);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h3',
        children,
        markDefs,
      });
    } else if (line.startsWith('## ')) {
      const text = line.substring(3);
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'h2',
        children,
        markDefs,
      });
    } else if (line.startsWith('# ')) {
      const text = line.substring(2);
      const { children, markDefs } = parseInlineFormatting(text);
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
      const text = line.substring(2);
      const { children, markDefs } = parseInlineFormatting(text);
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
      const text = line.replace(/^\d+\.\s+/, '');
      const { children, markDefs } = parseInlineFormatting(text);
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

export async function POST(req: Request) {
  try {
    const { title, slug, markdown, excerpt, author, tags, keyTakeaways, faqs } = await req.json();

    if (!title || !slug || !markdown) {
      return NextResponse.json({ error: 'Title, slug, and markdown content are required.' }, { status: 400 });
    }

    if (!process.env.SANITY_AUTH_TOKEN) {
      return NextResponse.json({ error: 'SANITY_AUTH_TOKEN is missing on server environment variables.' }, { status: 500 });
    }

    const postDoc = {
      _type: 'post',
      title,
      slug: { _type: 'slug', current: slug },
      publishedAt: new Date().toISOString(),
      excerpt: excerpt || '',
      author: author || 'Lovina Ethical Marine Team',
      tags: tags || [],
      keyTakeaways: keyTakeaways || [],
      faqs: faqs ? faqs.map((f: any) => ({
        _key: generateKey(),
        question: f.question || '',
        answer: f.answer || ''
      })) : [],
      body: markdownToPortableText(markdown),
    };

    const result = await client.create(postDoc);

    return NextResponse.json({ success: true, docId: result._id, title: result.title });
  } catch (err: any) {
    console.error('Sanity Publishing Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred during publishing to Sanity.' }, { status: 500 });
  }
}
