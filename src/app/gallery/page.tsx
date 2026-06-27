import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import { urlFor } from '@/sanity/lib/image';
import PhotoGallery from '@/components/PhotoGallery';
import { getLocaleServer } from '@/locales/i18n-server';
import Link from 'next/link';
import { t } from '@/locales/i18n';

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GalleryPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const locale = await getLocaleServer(resolvedParams);

  // Fetch Gallery Images
  const galleryImages = await client.fetch(groq`*[_type == "galleryImage"] | order(_createdAt desc)`);
  const formattedGallery = galleryImages.map((img: any) => ({
    _id: img._id,
    url: img.image ? urlFor(img.image).url() : null,
    alt: img.alt || '',
    caption: img.caption || ''
  })).filter((img: any) => img.url !== null);

  const hrefFor = (path: string) => {
    if (locale === 'en') return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}lang=${locale}`;
  };

  return (
    <main className="min-h-screen bg-cloud-dancer">
      {/* Gallery Hero / Header */}
      <section className="bg-deep-indigo text-cloud-dancer pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Link 
            href={hrefFor("/")} 
            className="text-transformative-teal hover:text-coral-pop text-xs font-bold uppercase tracking-widest mb-6 inline-block transition-colors"
          >
            ← {locale === 'en' ? 'Back to Home' : locale === 'ru' ? 'Назад на главную' : '返回首页'}
          </Link>
          <h1 className="text-5xl lg:text-7xl font-serif mb-6 leading-tight">
            {t('galleryTitle', locale)}
          </h1>
          <p className="text-xl text-cloud-dancer/60 font-light max-w-2xl mx-auto leading-relaxed">
            {t('gallerySubtitle', locale)}
          </p>
        </div>
      </section>

      {/* Gallery Component */}
      <div className="py-12">
        {formattedGallery.length > 0 ? (
          <PhotoGallery photos={formattedGallery} locale={locale} />
        ) : (
          <div className="max-w-6xl mx-auto px-6 py-24 text-center">
            <div className="w-20 h-20 bg-deep-indigo/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-deep-indigo/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif text-deep-indigo mb-2">No photos yet</h3>
            <p className="text-deep-indigo/50 font-light">We are still capturing the magic. Check back soon!</p>
          </div>
        )}
      </div>

      {/* Booking CTA Footer */}
      <section className="py-20 lg:py-32 px-6 text-center bg-transformative-teal relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/ocean-texture.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-serif text-cloud-dancer mb-8 leading-tight">{t("ctaTitle", locale)} <span className="italic text-coral-pop">peaceful</span> {t("ctaTitleEnd", locale)}</h2>
          <p className="text-lg text-cloud-dancer/70 mb-12 font-light">
            {t("ctaDesc", locale)}
          </p>
          <Link 
            href={hrefFor("/#packages")} 
            className="bg-coral-pop text-cloud-dancer px-12 py-5 rounded-full text-xl font-medium hover:bg-deep-indigo transition-all shadow-xl inline-block active:scale-95"
          >
            {t("ctaBtn", locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
