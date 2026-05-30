import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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
} catch (e) {}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1f5xaxdl',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-05-26',
});

async function inspect() {
  const query = '*[_type == "post" && slug.current match "*brunch*"][0]';
  const post = await client.fetch(query);
  
  if (post) {
    console.log(`Title: ${post.title}`);
    console.log(`Document ID: ${post._id}`);
    console.log(`Tags:`, post.tags);
    console.log(`Takeaways:`, post.keyTakeaways);
    console.log(`FAQs:`, post.faqs);
    console.log(`Body Blocks:`);
    console.log(JSON.stringify(post.body, null, 2));
  } else {
    console.log('No matching brunch post found.');
  }
}

inspect();
