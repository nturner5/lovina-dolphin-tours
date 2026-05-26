import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { PortableText } from '@portabletext/react';

export const revalidate = 60;

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch(
    groq`*[_type == "post" && slug.current == $slug][0]`,
    { slug }
  );

  if (!post) return <div className="p-32 text-center font-serif italic text-deep-indigo/30">Story not found.</div>;

  return (
    <article className="bg-cloud-dancer min-h-screen px-6 py-24 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 text-center">
          <p className="text-xs text-coral-pop uppercase tracking-[0.3em] font-bold mb-6">
            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="text-5xl lg:text-7xl font-serif text-deep-indigo mb-12 leading-[1.1]">{post.title}</h1>
          {post.mainImage && (
            <div className="aspect-[16/9] rounded-[3rem] overflow-hidden bg-deep-indigo/5 relative border border-deep-indigo/5 shadow-2xl">
              <Image 
                src={urlFor(post.mainImage).url()} 
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </header>
        
        <div className="prose prose-xl prose-headings:font-serif prose-headings:text-deep-indigo text-deep-indigo/80 max-w-none prose-p:leading-relaxed prose-p:font-light">
          <PortableText value={post.body} />
        </div>
      </div>
    </article>
  );
}
