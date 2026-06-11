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

// Helper to generate a random key
const generateKey = () => Math.random().toString(36).substring(2, 11);

// Call Google Generative Language API for Image Generation (Imagen 4)
async function generateImageWithGemini(promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${activeApiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: promptText,
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Image Generation API failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const b64Data = data.predictions?.[0]?.bytesBase64Encoded;
  
  if (!b64Data) {
    throw new Error(`Invalid response structure from Google Image Generation: ${JSON.stringify(data)}`);
  }

  return Buffer.from(b64Data, 'base64');
}

async function run() {
  console.log('🌴 Starting Automated Blog Image Generator...');
  
  // 1. Determine which post to process
  const requestedSlug = process.argv[2];
  let post;
  
  if (requestedSlug) {
    console.log(`🔎 Searching for post with slug: "${requestedSlug}"...`);
    post = await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0]`,
      { slug: requestedSlug }
    );
  } else {
    console.log('🔎 Searching for most recent post containing ":::image-prompt" blocks...');
    // Fetch posts that contain image-prompt blocks in their body
    const query = `*[_type == "post" && body[].children[].text match ":::image-prompt"] | order(publishedAt desc)[0]`;
    post = await sanityClient.fetch(query);
  }

  if (!post) {
    console.error('❌ Error: No matching blog post found that needs image generation.');
    process.exit(1);
  }

  console.log(`📝 Found post: "${post.title}" (ID: ${post._id})`);
  console.log(`🔗 Slug: /blog/${post.slug.current}`);
  
  const body = post.body || [];
  const updatedBody = [];
  let imageIndex = 1;
  let firstUploadedAssetRef = null;
  let firstUploadedAlt = '';
  let firstUploadedCaption = '';

  let inImagePrompt = false;
  let collectedBlocks = [];
  
  for (let i = 0; i < body.length; i++) {
    const block = body[i];
    
    // Check if this is the start of an image prompt block
    if (block._type === 'block') {
      const blockText = block.children?.map(c => c.text).join('').trim() || '';
      
      if (blockText === ':::image-prompt') {
        inImagePrompt = true;
        collectedBlocks = [];
        continue;
      }
      
      if (blockText === ':::') {
        if (inImagePrompt) {
          inImagePrompt = false;
          
          // We have collected all lines for this image prompt, let's process it
          let promptText = '';
          let altText = '';
          let captionText = '';
          
          for (const rawBlock of collectedBlocks) {
            const rawText = rawBlock.children?.map(c => c.text).join('').trim() || '';
            if (rawText.startsWith('**Midjourney Image Prompt:**') || rawText.startsWith('Midjourney Image Prompt:')) {
              promptText = rawText.replace(/^\*?\*?Midjourney Image Prompt:\*?\*?\s*/i, '').trim();
            } else if (rawText.startsWith('**SEO Alt Text:**') || rawText.startsWith('SEO Alt Text:')) {
              altText = rawText.replace(/^\*?\*?SEO Alt Text:\*?\*?\s*/i, '').trim();
            } else if (rawText.startsWith('**Caption:**') || rawText.startsWith('Caption:')) {
              captionText = rawText.replace(/^\*?\*?Caption:\*?\*?\s*/i, '').trim();
            } else if (rawText && !promptText) {
              // Fallback if formatting was slightly off
              promptText = rawText;
            }
          }

          if (!promptText) {
            console.warn('⚠️ Warning: Found image-prompt block but could not extract a prompt. Skipping...');
            continue;
          }

          // Clean up default placeholders in prompt
          promptText = promptText.replace(/\[description\]/g, 'a peaceful traditional Balinese landscape');
          
          console.log(`\n🎨 Generating Image #${imageIndex}...`);
          console.log(`💬 Prompt: "${promptText}"`);
          console.log(`🏷️ SEO Alt: "${altText || 'Lovina Bali'}"`);
          console.log(`📝 Caption: "${captionText || ''}"`);
          
          try {
            const imageBuffer = await generateImageWithGemini(promptText);
            console.log(`📥 Image generated successfully (${imageBuffer.length} bytes). Uploading to Sanity...`);
            
            const filename = `${post.slug.current}-image-${imageIndex}.jpg`;
            const asset = await sanityClient.assets.upload('image', imageBuffer, {
              filename: filename,
              contentType: 'image/jpeg',
            });
            
            console.log(`✅ Uploaded to Sanity. Asset ID: "${asset._id}"`);
            
            // Add custom alt text directly to the asset document if supported
            await sanityClient.patch(asset._id).set({ altText: altText }).commit().catch(() => {});
            
            // Create Sanity Image block
            const imageBlock = {
              _key: generateKey(),
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: asset._id,
              },
              alt: altText || post.title,
              caption: captionText || undefined,
            };

            // Store the first image as candidate for the hero mainImage
            if (!firstUploadedAssetRef) {
              firstUploadedAssetRef = asset._id;
              firstUploadedAlt = altText || post.title;
              firstUploadedCaption = captionText || '';
            }

            updatedBody.push(imageBlock);
            imageIndex++;
          } catch (err) {
            console.error(`❌ Failed to process Image #${imageIndex}:`, err.message);
            // Re-insert the original blocks so we don't lose the prompt text
            updatedBody.push({
              _key: generateKey(),
              _type: 'block',
              style: 'normal',
              children: [{ _key: generateKey(), _type: 'span', text: ':::image-prompt' }]
            });
            for (const b of collectedBlocks) {
              updatedBody.push(b);
            }
            updatedBody.push({
              _key: generateKey(),
              _type: 'block',
              style: 'normal',
              children: [{ _key: generateKey(), _type: 'span', text: ':::' }]
            });
          }
          continue;
        }
      }
    }
    
    if (inImagePrompt) {
      collectedBlocks.push(block);
    } else {
      updatedBody.push(block);
    }
  }

  // Update Sanity document
  console.log(`\n📤 Saving updated body text and replacing text placeholders with actual image blocks...`);
  
  const updateData = {
    body: updatedBody,
  };

  // If the post has no mainImage or it is currently empty, set it to the first generated image
  if (!post.mainImage || !post.mainImage.asset) {
    if (firstUploadedAssetRef) {
      console.log(`🖼️ Setting main cover hero image (mainImage) of the post...`);
      updateData.mainImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: firstUploadedAssetRef,
        },
        alt: firstUploadedAlt,
        caption: firstUploadedCaption || undefined,
      };
    }
  }

  try {
    await sanityClient.patch(post._id).set(updateData).commit();
    console.log(`🎉 Success! Post updated in Sanity Database.`);
    console.log(`🚀 All generated images are now fully integrated and live!`);
  } catch (err) {
    console.error('❌ Failed to update Sanity document:', err.message);
    process.exit(1);
  }
}

run();
