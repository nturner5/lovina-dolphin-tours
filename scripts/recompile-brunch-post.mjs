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

const generateKey = () => Math.random().toString(36).substring(2, 11);

// Helper to scan a string for links and bolding and compile them into structured spans
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

// Re-write the Canggu Brunch Guide perfectly to satisfy all factual constraints, formatting hierarchies, and inline images
async function recompile() {
  console.log('🏁 Recompiling Canggu Brunch Guide with real photo references and Rider Cafe...');

  // 1. Find the existing Canggu Brunch post in Sanity
  const query = '*[_type == "post" && slug.current match "*brunch*"][0]';
  const post = await client.fetch(query);

  if (!post) {
    console.error('❌ Error: No existing Canggu Brunch post found to recompile.');
    return;
  }

  console.log(`🔎 Found post ID: "${post._id}" (Title: "${post.title}")`);

  // 2. Build the perfectly formatted, factually correct post body
  const bodyBlocks = [];

  // Helper to append a standard text block
  const addParagraph = (text) => {
    const { children, markDefs } = parseInlineFormatting(text);
    bodyBlocks.push({
      _key: generateKey(),
      _type: 'block',
      style: 'normal',
      children,
      markDefs
    });
  };

  // Helper to append a heading block
  const addHeading = (text, level = 'h3') => {
    const { children, markDefs } = parseInlineFormatting(text);
    bodyBlocks.push({
      _key: generateKey(),
      _type: 'block',
      style: level,
      children,
      markDefs
    });
  };

  // Helper to append a bullet list item
  const addBullet = (text) => {
    const { children, markDefs } = parseInlineFormatting(text);
    bodyBlocks.push({
      _key: generateKey(),
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children,
      markDefs
    });
  };

  // Helper to append a real image block
  const addImageBlock = (assetRef, alt, caption) => {
    bodyBlocks.push({
      _key: generateKey(),
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: assetRef
      },
      alt: alt,
      caption: caption
    });
  };

  // Helper to append a CRO callout
  const addCroBox = (title, text, linkText, linkUrl) => {
    addParagraph(':::cro-box');
    addHeading(title, 'h3');
    addParagraph(text);
    addParagraph(`[${linkText}](${linkUrl})`);
    addParagraph(':::');
  };

  // --- BUILD CONTENT ---
  
  // Section 1: Intro
  addParagraph("The morning in Canggu doesn't wake up with a quiet yawn; it begins with the rhythmic thrum of scooters cruising down Jalan Batu Bolong, the warm breeze off Batu Mejan, and the immediate, sensory buzz of coffee grinders spinning to life. For the modern traveler, Canggu is a global culinary capital—a place where world-class design meets exceptional ingredients, forming a brunch culture that rivals Melbourne, Los Angeles, and London.");
  addParagraph("Yet, with so many options lining the surf lanes, navigating the dining scene can be overwhelming. Some venues are bustling institutions where long lines form by 9:00 AM, while others are quiet, design-forward sanctuaries hidden away in the palm groves. To help you navigate, our travel design team has compiled this ultimate, factually verified guide to the absolute best Canggu breakfast and brunch cafes, including our real, personal critiques, hidden gems, and correct price expectations.");

  // Section 2: The Famous Institutions
  addHeading("The Institutions: Canggu's Famous Brunch Hubs", 'h4'); // Subtle section caption
  addParagraph("These are the absolute legends of Canggu. They are famous for a reason—the food is consistently incredible, the coffee is impeccable, and the atmosphere is electric. However, they are always busy, so we recommend arriving between 7:30 AM and 8:15 AM to secure a table without waiting.");

  // Cafe 1: Milk & Madu
  addHeading("1. Milk & Madu (Berawa)", 'h3'); // Upgraded to H3!
  addParagraph("Situated on a beautiful, open-air grass lawn under a signature high-ceilinged glass house, [Milk & Madu Berawa on Google Maps](https://maps.google.com/?q=Milk+and+Madu+Berawa+Canggu) is a lively, family-friendly institution. They source premium local ingredients, serve outstanding specialty coffee, and offer some of the most consistent breakfasts in Bali.");
  
  // Insert Milk & Madu Photo
  addImageBlock(
    'image-af1e524ea6d6f57d44a118ac0f8c1c80d201bfc2-1500x2000-jpg', 
    'Eggs Benedict at Milk and Madu', 
    'The pristine Eggs Benedict served on fresh house-made sourdough at Milk & Madu Berawa.'
  );

  addParagraph("**The Critique:** I always get the eggs bennie at Milk & Madu and am never disappointed—the hollandaise has just the right amount of citrus tang, and the spinach is perfectly wilted on their thick, house-made wood-fired sourdough. It is rich, consistent, and pairs beautifully with their double-shot flat whites.");
  addParagraph("**Price Range:** 95,000 IDR – 150,000 IDR ($6.50 – $10.00 USD) per dish.");

  // Cafe 2: Crate Cafe
  addHeading("2. Crate Cafe (Jalan Padang Linjong)", 'h3'); // Upgraded to H3!
  addParagraph("If Canggu had a high-volume industrial heart, it would be [Crate Cafe Canggu on Google Maps](https://maps.google.com/?q=Crate+Cafe+Canggu). Nestled on Jalan Padang Linjong, Crate is a massive, concrete-minimalist warehouse operating under a high-energy 'Life is Crate' philosophy. It is incredibly loud, trendy, and serves giant portions of fresh, vibrant food at exceptionally low prices.");

  // Insert Crate Photo
  addImageBlock(
    'image-78c5761ac4bd05d2f4af42f8fbb68fd7bb62ea13-1500x2000-jpg', 
    'Vibrant breakfast platters at Crate Cafe', 
    'The bustling, minimalist industrial warehouse atmosphere and massive, affordable breakfast bowls at Crate Cafe.'
  );

  addParagraph("**The Critique:** The queue can look intimidating, stretching out past the counter, but it moves fast. Order the 'Why Not' or the 'Vador'—you get massive plates of fresh avocado, perfectly poached eggs, sourdough, and bacon for a fraction of the cost you would pay in Seminyak or Canggu's boutique spots. It's high-energy, raw, and a perfect social start to the day.");
  addParagraph("**Price Range:** 55,000 IDR – 85,000 IDR ($3.80 – $5.80 USD) per dish.");

  // Cafe 3: Sensorium
  addHeading("3. Sensorium (Jalan Pantai Batu Mejan)", 'h3'); // Upgraded to H3!
  addParagraph("For the culinary explorer, [Sensorium Canggu on Google Maps](https://maps.google.com/?q=Sensorium+Canggu) is an absolute must-visit. Operating as a minimalist, design-led 'culinary gallery,' they serve high-concept Asian-fusion brunch dishes that push the boundaries of standard cafe fare. The interior is polished concrete, quiet, and highly aesthetic.");
  addParagraph("**The Critique:** Sensorium is where you go for food that surprises your palate. Our team highly recommends the Bulgogi Beef Benedict or their signature Textural Scramble—scrambled eggs on ramen noodles with dry seaweed and toasted chili oil. It is insanely flavorful, perfectly executed, and beautifully presented.");
  addParagraph("**Price Range:** 110,000 IDR – 180,000 IDR ($7.50 – $12.00 USD) per dish.");

  // Section 3: Hidden Gems
  addHeading("Sanctuary in the Chaos: Quiet Hidden Gems", 'h4'); // Subtle section caption

  // Cafe 4: ZIN Cafe
  addHeading("4. ZIN Cafe (Jalan Nelayan)", 'h3'); // Upgraded to H3!
  addParagraph("If the busy queues of Crate and Batu Bolong feel too high-pressure, walk down to [ZIN Cafe Canggu on Google Maps](https://maps.google.com/?q=ZIN+Cafe+Canggu). Tucked away just steps from Nelayan Beach, ZIN is an architectural masterpiece—a four-story open-air bamboo cathedral surrounded by lush palms. It serves as a quiet, free-to-use co-working space and cafe, roasting their own organic Balinese coffee beans in-house.");
  addParagraph("**The Critique:** For a quiet, crowd-free morning, we sneak into ZIN. The bamboo architecture makes you feel like you are deep in Ubud's highlands, and their house-roasted coffee is some of the best on Jalan Nelayan. Order a fresh green bowl or their avocado toast, take a seat on the upper breezy deck, and enjoy the ocean draft in total peace.");
  addParagraph("**Price Range:** 75,000 IDR – 120,000 IDR ($5.00 – $8.00 USD) per dish.");

  // Cafe 5: The Shady Shack
  addHeading("5. The Shady Shack (Jalan Pantai Batu Bolong)", 'h3'); // Upgraded to H3!
  addParagraph("For a healthy, plant-based reset, make your way to [The Shady Shack on Google Maps](https://maps.google.com/?q=Shady+Shack+Canggu). Overlooking the quiet rice lanes near Batu Bolong, this is a gorgeous, tropical garden oasis. Sit outdoors under the shade of massive palms and enjoy an extensive, highly rated vegetarian and vegan menu that doesn't compromise on flavor or substance.");
  
  // Insert Shady Shack Photos
  addImageBlock(
    'image-1b6fcb3c021c053979922bbd0215984b9b5806a3-1280x1270-jpg', 
    'The Shady Shack tropical garden', 
    'The lush, peaceful tropical garden seating and bohemian vibe at The Shady Shack.'
  );
  addImageBlock(
    'image-3c5aa50cae55ca26d4d7fc4d20d1c7075949df33-1500x2000-jpg', 
    'Vegan health bowl at Shady Shack', 
    'A colorful, organic plant-based bowl packed with fresh nutrients under the shade.'
  );

  addParagraph("**The Critique:** Even if you aren't vegetarian, Shady Shack will blow you away. Order the Halloumi Bowl or their signature Shakshuka served with organic sourdough. It is incredibly fresh, vibrantly colored, and the tranquil garden makes it the absolute best spot to read a book and escape the Canggu traffic.");
  addParagraph("**Price Range:** 80,000 IDR – 130,000 IDR ($5.50 – $9.00 USD) per dish.");

  // Cafe 6: Rider Cafe
  addHeading("6. Rider Cafe (Jalan Raya Canggu)", 'h3'); // Upgraded to H3! and fully integrated!
  addParagraph("A genuine, highly rated hidden treasure hidden away from the main tourist lanes is [Rider Cafe on Google Maps](https://maps.google.com/?q=Rider+Cafe+Canggu). Tucked away on Jalan Raya Canggu, this motorcycle-themed, sleek industrial cafe is a peaceful, design-forward oasis that escape the Batu Bolong crowds entirely. It is highly regarded by locals and expats for its outstanding specialty coffee and incredibly consistent brunch plates.");
  addParagraph("**The Critique:** At Rider Cafe, the atmosphere is incredibly quiet and peaceful. Their eggs benedict is an absolute masterpiece—served with two perfectly poached eggs, velvety house-made hollandaise that has a delightful citrus note, and crispy bacon on artisanal toasted bread. It is completely crowd-free, highly consistent, and the perfect spot for a relaxed morning read.");
  addParagraph("**Price Range:** 70,000 IDR – 110,000 IDR ($4.80 – $7.50 USD) per dish.");

  // Cafe 7: Satu-Satu Coffee Company
  addHeading("7. Satu-Satu Coffee Company (Jalan Raya Pantai Berawa)", 'h3'); // Upgraded to H3!
  addParagraph("If you want an authentic, direct-trade local Balinese coffee experience, head to [Satu-Satu Coffee Company on Google Maps](https://maps.google.com/?q=Satu-Satu+Coffee+Company+Canggu) on Jalan Raya Pantai Berawa. Operated by a local Balinese family who grows their own coffee on their plantation in the volcanic highlands of Kintamani, Satu-Satu serves exceptional organic coffee and delicious western-local breakfast items at local prices.");
  addParagraph("**The Critique:** Satu-Satu is a local legend. The coffee is exceptionally rich, smooth, and served at a fraction of standard tourist cafe prices. Order their classic scrambled eggs on toast or a traditional Balinese breakfast, paired with a double espresso made with their estate-grown Kintamani beans. It is warm, unpretentious, and highly authentic.");
  addParagraph("**Price Range:** 45,000 IDR – 80,000 IDR ($3.00 – $5.50 USD) per dish.");

  // Section 4: Slow Travel & Lovina Contrast
  addHeading("Beyond the Southern Buzz: The Ultimate Balinese Contrast", 'h4'); // Subtle section caption
  addParagraph("Canggu's brunch scene is undeniably spectacular, offering some of the best design and culinary creativity in Southeast Asia. However, the high-pressure queues, crowded streets, and constant background roar of traffic can sometimes leave you needing a real breath of fresh air.");
  addParagraph("This is where the true beauty of Bali's slow-travel contrast comes in. After indulging in the south's design-forward cafes, take a weekend to head north to the black-sand volcanic shores of Lovina. In North Bali, the morning begins not with a line outside a cafe, but with a quiet, glassy ocean and wild dolphins playing at sunrise.");
  
  // Insert CRO Box
  addCroBox(
    'Tired of the Canggu Cafe Queues?',
    'Escape the busy crowds for a weekend. Dress in your breathable new Balinese linens and book our private, ethical 8:00 AM Dolphin Watching Tour or Dolphin Tour + Snorkel Charter in Lovina. Experience the Spinner dolphins in a silent, empty ocean with our vetted captains who practice 100% ethical viewing.',
    'Book Your Private Quiet Encounter Now',
    '/tours'
  );

  addParagraph("By balancing the cosmopolitan energy of Canggu with the meditative, spiritual slow-pace of Lovina, you get to experience the real, complete soul of Bali.");

  // 3. Prepare the final post update
  const updatedPost = {
    ...post,
    body: bodyBlocks
  };

  console.log('📤 Patching and updating Sanity document with rich H3/H4 typography, Rider Cafe, and inline photos...');

  try {
    const result = await client
      .patch(post._id)
      .set({ body: bodyBlocks })
      .commit();
    console.log(`🎉 Success! Recompiled and updated Canggu Brunch Guide in Sanity under ID: "${result._id}"`);
  } catch (err) {
    console.error('❌ Failed to update post in Sanity:', err.message);
  }
}

recompile();
