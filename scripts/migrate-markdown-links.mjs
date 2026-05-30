import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// 1. Parse .env.local manually
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
  console.error('Failed to parse .env.local', e.message);
}

const sanityToken = process.env.SANITY_AUTH_TOKEN;

if (!sanityToken) {
  console.error('❌ Error: SANITY_AUTH_TOKEN is missing in .env.local.');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1f5xaxdl',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: sanityToken,
  apiVersion: '2024-05-26',
});

const generateKey = () => Math.random().toString(36).substring(2, 11);

// Upgrade markdown link and bold parsing
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

async function migrate() {
  console.log('🧹 Starting self-healing blog links and bold formatting migration...');
  
  try {
    const posts = await client.fetch('*[_type == "post"]');
    console.log(`🔎 Found ${posts.length} blog posts in Sanity.`);
    
    for (const post of posts) {
      console.log(`📦 Inspecting post: "${post.title}" (ID: ${post._id})`);
      let hasUpdates = false;
      const updatedBody = [];
      
      if (!post.body || !Array.isArray(post.body)) {
        console.log(`   ⚠️ Skip: Post has no body content.`);
        continue;
      }
      
      for (const block of post.body) {
        if (block._type === 'block') {
          const blockText = block.children?.map(c => c.text).join('') || '';
          
          if (/\[([^\]]+)\]\(([^)]+)\)/.test(blockText) || /\*\*/.test(blockText)) {
            console.log(`   💡 Found raw markdown formatting (links or bold) in text: "${blockText}"`);
            
            const { children, markDefs } = parseInlineFormatting(blockText);
            
            updatedBody.push({
              ...block,
              children,
              markDefs: [...(block.markDefs || []), ...markDefs]
            });
            hasUpdates = true;
          } else {
            updatedBody.push(block);
          }
        } else {
          updatedBody.push(block);
        }
      }
      
      if (hasUpdates) {
        console.log(`   📤 Patching post in database with fully compiled structured markup...`);
        await client
          .patch(post._id)
          .set({ body: updatedBody })
          .commit();
        console.log(`   ✅ Successfully updated: "${post.title}"`);
      } else {
        console.log(`   👍 No raw markdown formatting found in this post.`);
      }
    }
    
    console.log('🏁 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

migrate();
