import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogIndex() {
  const posts = await client.fetch(groq`*[_type == "post"] | order(publishedAt desc)`);

  return (
    <main className="bg-soft-bone min-h-screen px-6 py-24 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl lg:text-6xl font-serif text-volcanic-navy mb-12">Ethical Journal</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {posts.map((post: any) => (
            <Link key={post._id} href={`/blog/${post.slug.current}`} className="group">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-volcanic-navy/5 mb-6 relative border border-sand-dune/20">
                {post.mainImage && (
                  <Image 
                    src={urlFor(post.mainImage).url()} 
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
              <h2 className="text-2xl font-serif text-volcanic-navy mb-2 group-hover:text-muted-slate transition-colors">{post.title}</h2>
              <p className="text-sm text-muted-slate uppercase tracking-widest">
                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </Link>
          ))}

          {posts.length === 0 && (
            <div className="col-span-full text-center py-24 border-2 border-dashed border-sand-dune/30 rounded-3xl">
              <p className="font-serif italic text-xl text-volcanic-navy/30">No stories published yet. Visit /admin to create your first post.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
