import { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://balidolphintours.com';

  // Fetch all posts slugs and publishedAt dates from Sanity
  let posts: { slug: string; publishedAt: string }[] = [];
  try {
    const data = await client.fetch(
      groq`*[_type == "post" && defined(slug.current)]{
        "slug": slug.current,
        publishedAt
      }`
    );
    posts = data || [];
  } catch (error) {
    console.error('Error fetching sitemap posts:', error);
  }

  // Base routes
  const routes = [
    '',
    '/tours',
    '/blog',
    '/privacy',
    '/terms',
    '/refunds',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : route === '/tours' ? 0.9 : 0.7,
  }));

  // Dynamic blog routes
  const blogRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt
      ? new Date(post.publishedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...routes, ...blogRoutes];
}
