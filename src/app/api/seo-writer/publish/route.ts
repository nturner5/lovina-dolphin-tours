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

// Robust markdown line parser to compile paragraphs, lists, and headings into standard Sanity PortableText
function markdownToPortableText(markdownText: string) {
  const lines = markdownText.split('\n');
  const blocks: any[] = [];
  
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

export async function POST(req: Request) {
  try {
    const { title, slug, markdown } = await req.json();

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
      body: markdownToPortableText(markdown),
    };

    const result = await client.create(postDoc);

    return NextResponse.json({ success: true, docId: result._id, title: result.title });
  } catch (err: any) {
    console.error('Sanity Publishing Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred during publishing to Sanity.' }, { status: 500 });
  }
}
