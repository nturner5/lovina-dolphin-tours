import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';

export const revalidate = 60;

export default async function BlogIndex() {
  const posts = await client.fetch(groq`*[_type == "post"] | order(publishedAt desc)`);

  return (
    <main className="bg-cloud-dancer min-h-screen px-6 pt-12 pb-24 lg:pt-16 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20 text-center">
          <h1 className="text-6xl lg:text-7xl font-serif text-deep-indigo mb-6">Our Blog</h1>
          <p className="text-lg text-deep-indigo/60 font-light max-w-xl mx-auto italic">Stories and tips for travelers in Lovina.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
          {posts.map((post: any) => (
            <Link key={post._id} href={`/blog/${post.slug.current}`} className="group">
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-deep-indigo/5 mb-8 relative border border-deep-indigo/5 shadow-sm group-hover:shadow-xl transition-all duration-500">
                {post.mainImage && (
                  <Image 
                    src={urlFor(post.mainImage).url()} 
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-3xl font-serif text-deep-indigo mb-4 group-hover:text-transformative-teal transition-colors leading-tight">{post.title}</h2>
              <p className="text-xs text-coral-pop uppercase tracking-[0.2em] font-bold">
                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </Link>
          ))}

          {posts.length === 0 && (
            <div className="col-span-full text-center py-32 border-2 border-dashed border-deep-indigo/10 rounded-[3rem]">
              <p className="font-serif italic text-2xl text-deep-indigo/20">The blog is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
