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

  if (!post) return <div className="p-24 text-center font-serif italic">Post not found</div>;

  return (
    <article className="bg-soft-bone min-h-screen px-6 py-24 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <p className="text-sm text-muted-slate uppercase tracking-[0.2em] mb-4">
            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="text-5xl lg:text-6xl font-serif text-volcanic-navy mb-8 leading-tight">{post.title}</h1>
          {post.mainImage && (
            <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-volcanic-navy/5 relative border border-sand-dune/20">
              <Image 
                src={urlFor(post.mainImage).url()} 
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </header>
        
        <div className="prose prose-lg prose-headings:font-serif prose-headings:text-volcanic-navy text-volcanic-navy/80 max-w-none">
          <PortableText value={post.body} />
        </div>
      </div>
    </article>
  );
}
