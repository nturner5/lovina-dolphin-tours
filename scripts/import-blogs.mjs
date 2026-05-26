import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '1f5xaxdl',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-05-26',
});

const posts = [
  {
    _type: 'post',
    title: 'Why We Don’t Chase: The Truth About Lovina’s Dolphins',
    slug: { _type: 'slug', current: 'why-we-dont-chase' },
    publishedAt: new Date().toISOString(),
    body: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'There is a common sight in Lovina at 6:15 AM: fifty boats racing at full speed toward a single dorsal fin. For many travelers, this "chase" feels less like a nature encounter and more like a hunt.' }],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'At Lovina Ethical, we believe the best way to see a dolphin is on their terms, not ours. Our "No-Chase" protocol isn’t just a marketing slogan; it’s a commitment to passive observation.' }],
        markDefs: [],
        style: 'normal',
      }
    ],
  },
  {
    _type: 'post',
    title: '6:00 AM vs 8:00 AM: When is the Best Time to See Dolphins?',
    slug: { _type: 'slug', current: '6am-vs-8am' },
    publishedAt: new Date().toISOString(),
    body: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'The "Sunrise Tour" is the most famous experience in North Bali. But is it actually the best? We compare the two windows for sighting probability and experience quality.' }],
        markDefs: [],
        style: 'normal',
      }
    ],
  },
  {
    _type: 'post',
    title: 'Beyond the Dolphins: A 48-Hour Guide to Relaxed Lovina',
    slug: { _type: 'slug', current: 'beyond-the-dolphins' },
    publishedAt: new Date().toISOString(),
    body: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Lovina is often treated as a "one-night stand" on the way to West Bali. But this stretch of volcanic sand has a soul that southern Bali has lost.' }],
        markDefs: [],
        style: 'normal',
      }
    ],
  }
];

async function importPosts() {
  if (!process.env.SANITY_AUTH_TOKEN) {
    console.error('❌ Error: SANITY_AUTH_TOKEN is missing.');
    return;
  }

  console.log('🚀 Starting import...');
  for (const post of posts) {
    try {
      const result = await client.create(post);
      console.log('✅ Created post: ' + result.title);
    } catch (err) {
      console.error('❌ Failed to create post: ' + post.title, err.message);
    }
  }
  console.log('🏁 Import complete!');
}

importPosts();
