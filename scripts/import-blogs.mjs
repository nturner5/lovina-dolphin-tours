import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '1f5xaxdl',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-05-26',
});

// Helper to generate Sanity-compatible unique keys
const generateKey = () => Math.random().toString(36).substring(2, 11);

// Robust markdown line parser to compile paragraphs, lists, and headings into standard Sanity PortableText
function markdownToPortableText(markdownText) {
  const lines = markdownText.split('\n');
  const blocks = [];
  
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

const rawPosts = [
  {
    title: 'Why We Don’t Chase: The Truth About Lovina’s Dolphins',
    slug: 'why-we-dont-chase',
    markdown: `
#### 1. Is a dolphin tour in Lovina actually ethical?
If you have spent any time reading travel forums, TripAdvisor reviews, or Reddit threads about North Bali, you have likely run into a common, unsettling critique: the Lovina dolphin chase. 

Every morning at 6:00 AM, as the sun begins to paint the sky in hues of purple and orange, a fleet of up to a hundred diesel-powered outriggers launches from the volcanic beaches. Their target? The wild pods of Spinner and Bottlenose dolphins that have gathered in the calm waters of the Bali Sea to feed. The moment a dorsal fin breaks the surface, the motors roar. Boats race at full throttle to get close, crowding the pod and forcing the animals to dive deep in panic. For many conscious travelers, this "chase" feels less like a respectful nature encounter and more like a high-speed hunt. It leaves visitors feeling guilty and disoriented, and it places immense stress on the animals.

So, is it possible to see Lovina’s dolphins ethically? 

The short answer is yes—but only if you change the way you approach the ocean. At Lovina Ethical Marine, we operate under a strict, non-negotiable "No-Chase" protocol. We do not participate in the sunrise race. Instead, we treat the sea as a sanctuary, believing that the best way to observe wild dolphins is entirely on their own terms. When we change our behavior, the dolphins change theirs.

#### 2. The Science of the Swarm: Why Chasing Hurts
Dolphins are cetaceans that rely almost entirely on acoustic communication, navigation, and hunting. Under the surface, the ocean is a world of sound. Dolphins use echolocation—emitting high-frequency clicks that bounce off objects—to find fish, map their surroundings, and communicate with family members. 

When fifty or a hundred outrigger boats operate high-RPM diesel engines in a concentrated area, the underwater environment becomes deafening. The acoustic stress is severe. The loud motor noise:
*   Masks their echolocation, making it difficult for the dolphins to hunt effectively during their prime feeding hours.
*   Disorients calves, occasionally separating mother-calf pairs.
*   Forces the pods to expend precious energy diving deep and fleeing rather than resting or feeding.

Over time, this constant daily harassment can drive wild pods away from their natural coastal habitats altogether. This is why a simple shift in maritime behavior is not just a branding choice; it is an ecological necessity.

#### 3. Our Protocol: The Silent Agreement
At Lovina Ethical Marine, we do not chase, swarm, or cut off pods. Our team of captains operates under a strict code of passive observation:

*   The 30-Meter Border: We never approach closer than 30 meters. If dolphins appear, we maintain a parallel path, moving at a slow, constant speed rather than pointing the bow directly at them.
*   Engines to Neutral: The moment we are within range, our captains shift our engines into neutral. The boat becomes a quiet, drifting viewing platform.
*   Letting Them Choose: Because we cut our engine noise, the acoustic stress disappears. Dolphins are naturally highly social and curious creatures. When a boat sits quietly in the water without screaming motors, the dolphins often choose to swim toward us. They glide right under the wooden outrigger wings, rolling on their sides to look up at us. It is an intimate, eye-to-eye connection that is completely impossible to experience during a high-speed chase.

#### 4. The Captain’s Insider Tip: Spinner vs. Bottlenose
Only a local captain who spends every morning on the water can tell you how to spot the difference between the two primary species of Lovina:

*   The Spinner Dolphins (Stenella longirostris): These are the acrobats of the Bali Sea. They are smaller, slender, and travel in large, highly social schools of 20 to 100+ animals. You will recognize them by their dramatic, corkscrew jumps. They spin up to seven times in a single leap! Our captains know that Spinners are most active in the early morning, using their jumps to communicate and shake off parasites.
*   The Bottlenose Dolphins (Tursiops truncatus): These are the larger, deeper-grey dolphins made famous by ocean documentaries. They travel in smaller, intimate family groups of 5 to 15. They are calmer, highly intelligent, and much more curious about stationary outriggers. If a Bottlenose pod approaches our quiet boat, stay perfectly still—they love to swim slowly alongside the hull, clicking and whistling just below the surface.

#### 5. The Glassy Mirror of the 8:00 AM Sea
To experience this properly, you must abandon the sunrise rush. By 8:00 AM, the hundred-boat swarm has returned to the beach for hotel breakfasts. The ocean falls completely silent. 

The wind is still soft, and the volcanic sand under the water reflects the deep blue of the sky. The sea becomes a vast, glassy mirror, so still that you can see the reflection of the mountains on the horizon. There is no sound except for the gentle lap of water against our wooden outrigger. Suddenly, you hear a loud, rhythmic whoosh—the sound of a dolphin breaking the glassy surface to breathe. Because the water is so flat, you can look down into the water column and watch their dark, sleek silhouettes glide effortlessly beneath your feet. It is a moment of pure, uninterrupted peace.

#### 6. Experience Lovina on Their Terms
If you are staying in a North Bali villa or planning a day trip from Ubud or Canggu, we invite you to join us for a respectful, private morning on the water. We operate a small, dedicated team of professional captains who take immense pride in protecting our marine sanctuary.

Avoid the crowds, skip the chase, and secure your private, quiet outrigger boat today.
`
  },
  {
    title: '6:00 AM vs 8:00 AM: When is the Best Time to See Dolphins?',
    slug: '6am-vs-8am',
    markdown: `
#### 1. Is waking up at 5:00 AM actually worth it?
It is the most common itinerary question every traveler asks when planning a trip to North Bali: "What time should we book our Lovina dolphin tour?"

Historically, there has only been one answer: 6:00 AM. For decades, hotel guides and beach touts have told tourists that they must launch at the crack of dawn to have any chance of seeing the wild Spinner and Bottlenose pods. As a result, thousands of travelers set their alarms for 5:00 AM, stumble into the dark morning air, and head to the beach, expecting a quiet, romantic sunrise encounter.

Instead, they find a chaotic, high-density fleet of up to a hundred outrigger boats, all jostling for position and racing high-RPM diesel engines to chase after the same pods.

But what if you didn’t have to wake up in the dark? What if the secret to a much better, quieter dolphin sighting was simply sleeping in and launching later? 

At Lovina Ethical Marine, we pioneered the 8:00 AM "Quiet Departure" strategy. Below, we break down the scientific, environmental, and practical differences between the classic 6:00 AM sunrise rush and the peaceful 8:00 AM mid-morning window, helping you choose the perfect experience for your trip.

#### 2. The 6:00 AM "Sunrise Tour" Breakdown
*   The Sighting Rate: 95% Sighting Rate. Because the sun is low, dolphins are highly active near the surface, making them easy to spot.
*   The Atmosphere: Visually spectacular. Waking up to watch the sunrise outline Mount Agung and the volcanic ridge in purple, pink, and gold is a bucket-list Bali sight.
*   The Reality: High stress. You are sharing the ocean with 80 to 100+ other outrigger boats. The moment a dolphin dorsal fin appears, multiple boats race full throttle toward the pod. The acoustic noise is overwhelming, the air is thick with diesel exhaust, and the dolphins spend most of their time diving deep to flee the noise. It feels less like an appreciation of nature and more like a crowded theme-park ride.

#### 3. The 8:00 AM "Quiet Tour" Breakdown (The Insider Secret)
*   The Sighting Rate: 90% Sighting Rate. A common myth is that dolphins disappear after sunrise. In reality, Lovina's dolphins are resident pods that feed in the calm coastal trenches until mid-morning (around 10:30 AM). They do not leave.
*   The Atmosphere: Absolute serenity. By 8:00 AM, the entire 6:00 AM crowd has returned to shore for their hotel breakfasts. The ocean is empty. You will typically share the entire sea with fewer than five other boats, often having the pods completely to yourself.
*   The Reality: Peaceful and respectful. Because there are no screaming engines, the acoustic stress disappears. The dolphins are calm, moving slowly at the surface, resting, and playing. Our captains can shift our engines to neutral and let the curious animals approach our quiet boat on their own terms. You get clean air, total silence, and a relaxed, unhurried morning.

#### 4. The Captain’s Advice: The Feeding Biology of Lovina
Why do the dolphins stay active until mid-morning? Our professional captains understand the local marine biology. 

Lovina Beach sits adjacent to a massive, deep underwater volcanic trench. During the night, deep-sea currents push thousands of small baitfish and squid up into the shallower shelf waters. This is known as diel vertical migration. As the sun rises, the dolphins hunt these baitfish near the surface. This feeding frenzy does not stop at sunrise; it continues actively until the sun gets hot and the baitfish migrate back down into the cool, dark depths of the trench (typically around 10:30 AM). 

This means that booking an 8:00 AM departure doesn't reduce your sighting success—it simply removes the boat crowds, giving you a front-row seat to watch the dolphins feed calmly and naturally.

#### 5. The Glassy Water & Sun Protection
There is one major difference you should prepare for: the sun. 

During the 6:00 AM window, the air is cool and crisp. By 8:00 AM, the Bali sun is fully up, reflecting off the flat water. 

However, this light brings a massive advantage: clarity. Because the sun is higher in the sky, it shines directly down into the calm water column. The sea becomes a vast, glassy mirror of deep teal. If you wear polarized sunglasses, the surface glare disappears completely, allowing you to see five to ten meters deep into the volcanic water. You can watch dolphins swimming, spinning, and playing right alongside our outrigger wings before they even break the surface. 

Just make sure to bring a brimmed hat, a light long-sleeve shirt or windbreaker, and reef-safe sunscreen to protect yourself from the midday warmth.

#### 6. Choose Your Morning on the Sea
If your priority is a classic sunrise photo and you don't mind boat crowds, the 6:00 AM rush is a popular Bali experience. 

But if you are staying in a private villa, traveling with family, or simply want a quiet, respectful, and deeply peaceful nature encounter in total silence, the 8:00 AM window is the ultimate hidden gem of North Bali.

Let our team of professional local captains guide you through a quiet, unhurried morning on the Bali Sea.
`
  },
  {
    title: 'Beyond the Dolphins: A 48-Hour Guide to Relaxed Lovina',
    slug: 'beyond-the-dolphins',
    markdown: `
#### 1. Is Lovina actually worth staying overnight?
For most travelers visiting Bali, Lovina is treated as a "one-night stand." 

The typical itinerary is highly exhausting: hire a private driver in Seminyak or Ubud at 2:00 AM, drive four hours through the dark winding mountain passes of Bedugul, hop onto a crowded outrigger boat at 6:00 AM, chase dolphins for two hours, grab a quick coffee, and immediately drive back to the south. By the time these day-trippers return to their hotels, they are exhausted, stressed, and have seen nothing of North Bali except a chaotic harbor and a highway.

This is a travel mistake. 

North Bali has retained the slow, authentic soul that Southern Bali lost decades ago. This stretch of black volcanic sand, backed by steep mountain ridges and pristine coral reefs, deserves to be explored slowly. 

At Lovina Ethical Marine, we advocate for slow, mindful travel. Below, our team of local captains has curated the perfect 48-hour itinerary to experience the real, relaxed Lovina—from secret mountain descents and healthy coral reefs to the best protein-heavy warungs that only locals know about.

#### 2. Day 1: The Scenic Descent & Sunset Bintangs
Skip the main highway and take the mountain route via Munduk. 

As you climb into the central highlands, the air becomes cool and mist-shrouded. Stop at the Twin Lakes viewpoint (Tamblingan and Buyan), but skip the commercial, artificial "selfie stations." Instead, stop at a local roadside stall to buy fresh, organic mangosteens and strawberries grown in the rich volcanic soil. 

Descend into Lovina around 3:00 PM. The transition from the humid south to the dry, breezy climate of the north is immediate. Check into your villa, and head straight to the beach. 

Unlike the crowded, high-pressure beaches of Canggu, Lovina’s black sand beaches are quiet and calm. Sit down at a local beachfront warung, order a cold Bintang, and watch the sunset. Because Lovina faces north-west, the sun sets slowly over the Java Sea, silhouetting the distant East Java volcanoes in a dramatic display of deep orange and crimson.

#### 3. Day 2: The Silent Sea & Pristine Coral Reefs
Wake up at a civilized 7:00 AM. Enjoy a fresh tropical fruit breakfast at your villa before walking down to our private launch point at 7:30 AM.

At 8:00 AM, you set sail on your Private Ethical Dolphin Encounter. While the hundreds of 6:00 AM sunrise boats are returning to shore, you head out into an empty, perfectly silent ocean. Watch the wild Spinner and Bottlenose pods feed and play in total peace, with no screaming engines to disrupt the encounter.

##### Snorkeling the Lovina Reef
Once you have spent time with the dolphins, ask your captain to steer toward the Lovina Reef Sanctuary. 

While Southern Bali’s reefs have suffered from high tourist traffic, Lovina’s shallow reef is exceptionally healthy. The coral gardens here are some of the most biodiverse in Bali, featuring massive brain corals, delicate staghorn formations, and vibrant blue sea stars. Keep your eyes open for green sea turtles, clownfish (Nemo) living in colorful anemones, and schools of neon damselfish. 

Our outriggers carry premium, clean snorkeling gear and custom fins, so you can float effortlessly over the shallow gardens in crystal-clear visibility.

#### 4. The Captain’s Lunch: Where to Find Real Local Protein
After three hours on the saltwater, you will have built up a massive appetite. Skip the Western tourist cafes and eat where our captains eat:

*   Warung Nemo (The Fresh catch): Located just off the main beach, this warung specializes in fresh-caught seafood. Ask for the grilled Mahi-Mahi or Red Snapper, cooked over dry coconut husks and basted in a rich Balinese garlic-butter sauce. It is packed with high-quality protein, incredibly fresh, and costs a fraction of Southern Bali prices.
*   The Morning Pasar (Pasar Pagi Lovina): If you want a real local culinary experience, visit the morning market. Look for the small charcoal grills smoking near the entrance. Ask for Sate Ayam (chicken satay). These are real, lean chicken skewers grilled over hot coals, served with a fresh, spicy peanut sauce and steamed rice cake (lontong). It is authentic, delicious, and a perfect post-swim fuel.

#### 5. Day 3: Volcanic Hot Springs & Secret Waterfalls
Before you check out and head south, enjoy one final relaxing morning. 

Drive ten minutes west of Lovina to the Banjar Hot Springs (Air Panas Banjar). Nestled deep in a jungle valley, these sulfuric pools have been used for centuries for their natural healing properties. Arrive early at 8:00 AM to have the hot, emerald-green waters entirely to yourself before the day-trippers arrive. Soak under the stone dragon spouts, feeling the warm, mineral-rich water soothe your muscles.

On your drive back to the south, take the route toward Sekumpul Waterfall. Unlike the crowded, single-drop waterfalls near Ubud, Sekumpul is a collection of seven towering, high-volume falls hidden deep in an old-growth jungle canyon. The trek down is steep and challenging, but standing at the base of these massive volcanic cliffs surrounded by cool mist is a spiritual, unforgettable Bali experience.

#### 6. Experience North Bali Properly
Lovina is not a place to be rushed. It is a place to slow down, breathe the clean sea air, and enjoy Bali as it used to be.

By staying overnight, booking an ethical 8:00 AM private outrigger, and exploring the volcanic highlands, you get an authentic slow-travel experience that supports the local community and protects North Bali's ecosystems.

Secure your private outrigger boat and start your North Bali journey today.
`
  },
  {
    title: 'Is the Lovina Dolphin Tour Ethical? What the Reviews Don\'t Tell You',
    slug: 'lovina-dolphin-tour-ethical',
    markdown: `
#### 1. Is the Lovina dolphin tour really that bad?
If you search for a "Lovina dolphin tour review" on TripAdvisor, travel blogs, or Reddit's r/bali, you will quickly notice a massive divide. On one hand, you see glowing accounts of seeing dozens of wild dolphins jumping against a spectacular pink sunrise. On the other hand, you find warning reviews using words like "stressful," "chaotic," "harassment," and "dolphin chase."

Many travelers write that they felt incredibly guilty watching 100+ outrigger boats, with loud diesel engines roaring at high speeds, racing full-throttle to swarm a single pod of dolphins.

So, what is the truth? Is dolphin watching in Lovina inherently unethical, or is there a way to experience this natural wonder respectfully?

The truth is that the standard 6:00 AM sunrise tour has become a commodity "race to the bottom" that is highly stressful for the dolphins and disappointing for conscious travelers. But it doesn't have to be that way. At Lovina Ethical Marine, we operate as a full-scale private operator with a dedicated team of local captains. We have redesigned the entire experience from the ground up, proving that when you prioritize dolphin welfare, you actually get a far superior, peaceful, and intimate sighting.

#### 2. The Standard Sunrise Tour: A Recipe for Stress
To understand why the standard Lovina tour gets negative reviews, you have to look at the mechanics of the "sunrise swarm."

Most local boat captains are independent operators competing for commissions. They launch at exactly 6:00 AM because that is when the tourist crowds arrive. When up to a hundred boats gather in a small coastal area:
*   The Chase Instinct: If a dolphin breaks the surface, every boat accelerates at full speed to get their guests close for a photo. This turns into a high-speed chase.
*   The Barrier Effect: Boats often surround or cut off the path of the traveling pods. Dolphins are mammals that must surface to breathe, and blocking their path forces them to dive in panic, disrupting their natural movement.
*   Decibel Harassment: The high-pitched whine of dozens of old outrigger engines operating at high RPMs creates extreme underwater noise, disrupting the dolphins' echolocation and hunting.

This is the chaotic reality that shocks so many travelers who booked expecting a peaceful wildlife encounter.

#### 3. How We Do It Differently: The Lovina Ethical Standard
At Lovina Ethical Marine, we operate under a strict, non-negotiable code of passive observation. We don't book random beach outriggers; our professional captains are part of our family, operating premium, clean boats under direct operator standards:

*   The 8:00 AM Departure (The Anti-Sunrise Strategy): We don't launch at 6:00 AM. We wait. By 8:00 AM, the 100-boat swarm has returned to the beach for breakfast, leaving the ocean completely empty and serene.
*   Parallel Approach & Respectful Border: We never point our bow directly at a pod. We cruise parallel at a constant, slow speed, maintaining a minimum 30-meter buffer zone. We never surround, block, or chase the animals.
*   Engines to Neutral: The moment we are near the pod, our captains shift our engines into neutral. We drift in silence. Without engine noise, the acoustic stress disappears, and the ocean falls completely quiet.
*   The Power of Curiosity: Dolphins are highly curious and social. When a boat sits quietly without engine noise, the dolphins do not flee. Instead, they often choose to swim toward us, playing right alongside the outrigger's wooden wings and looking up at our guests.

#### 4. The Captain’s Insight: Understanding Dolphin Behavior
Only a professional captain who is trained in marine ethics can help you read dolphin behavior. Our captains know how to spot the difference between a stressed pod and a calm, happy pod:

*   Stressed Pod Behaviors (Common at 6:00 AM): Dolphins are diving for long periods (5+ minutes), swimming in irregular directions to shake off boats, or making short, rapid leaps to flee. If you see this, a respectful boat always cuts its engine and backs away.
*   Calm Pod Behaviors (Common at 8:00 AM): Dolphins are traveling slowly at the surface, playing with calves, surfing the boat’s gentle wake, or swimming directly toward stationary outriggers out of curiosity. 

By understanding these signals, our team ensures we never disrupt their natural habitat, giving you a completely guilt-free, authentic view of wild cetacean life.

#### 5. A Peaceful Morning on the Sea
Picture this: It is 8:30 AM. The central Bali mountains are framed against a clear blue sky, reflecting perfectly in a flat, glassy ocean. The swarm of tourist boats is gone. 

Your outrigger sits completely still, the captain having shifted the engine to neutral. There is no sound except the soft lap of water against the wooden hull. Suddenly, you hear a loud, rhythmic whoosh—the sound of a dolphin surfacing to breathe. You look down, and through the clear volcanic water, you see a family of three Bottlenose dolphins swimming slowly just below the surface, their silver silhouettes visible in the morning light. 

This is the peaceful, respectful experience that travelers actually want when they search for a "Lovina dolphin tour review". 

#### 6. Book a Respectful Private Encounter
If you are staying in a North Bali villa or planning a slow-travel day trip from Ubud or Canggu, we invite you to experience the ocean with us. By choosing a professional, ethical operator, you support sustainable tourism, protect North Bali's wild pods, and enjoy a peaceful morning on the water.

Skip the chase, respect the sea, and secure your private outrigger boat today.
`
  }
];

const posts = rawPosts.map(p => ({
  _type: 'post',
  title: p.title,
  slug: { _type: 'slug', current: p.slug },
  publishedAt: new Date().toISOString(),
  body: markdownToPortableText(p.markdown)
}));

async function importPosts() {
  if (!process.env.SANITY_AUTH_TOKEN) {
    console.error('❌ Error: SANITY_AUTH_TOKEN is missing.');
    return;
  }

  console.log('🧹 Cleaning up broken posts...');
  try {
    const query = '*[_type == "post"]';
    const existingPosts = await client.fetch(query);
    
    for (const p of existingPosts) {
      await client.delete(p._id);
      console.log('🗑️ Deleted existing post: ' + p.title);
    }
  } catch (err) {
    console.warn('⚠️ Cleanup warning:', err.message);
  }

  console.log('🚀 Starting re-import with keys...');
  for (const post of posts) {
    try {
      const result = await client.create(post);
      console.log('✅ Created post: ' + result.title);
    } catch (err) {
      console.error('❌ Failed to create post: ' + post.title, err.message);
    }
  }
  console.log('🏁 Import complete and keys fixed!');
}

importPosts();
