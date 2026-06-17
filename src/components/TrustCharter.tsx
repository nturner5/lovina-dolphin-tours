import { t } from '@/locales/i18n';
import { Locale } from '@/locales/translations';

interface TrustCharterProps {
  locale: Locale;
}

export default function TrustCharter({ locale }: TrustCharterProps) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-deep-indigo/5 shadow-sm max-w-6xl mx-auto mt-16 lg:mt-24 select-none">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
        <h4 className="text-2xl sm:text-3xl font-serif text-deep-indigo mb-3">
          {t('trustCharterTitle', locale)}
        </h4>
        <p className="text-xs sm:text-sm text-deep-indigo/60 font-light leading-relaxed">
          {t('trustCharterSub', locale)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Pillar 1: Ethical */}
        <div className="flex flex-col items-center text-center p-4 rounded-3xl hover:bg-cloud-dancer/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-transformative-teal/10 flex items-center justify-center text-transformative-teal mb-4 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h5 className="font-serif font-bold text-deep-indigo text-base mb-2">
            {t('trustItemEthicalTitle', locale)}
          </h5>
          <p className="text-xs text-deep-indigo/70 font-light leading-relaxed">
            {t('trustItemEthicalDesc', locale)}
          </p>
        </div>

        {/* Pillar 2: Safety */}
        <div className="flex flex-col items-center text-center p-4 rounded-3xl hover:bg-cloud-dancer/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-transformative-teal/10 flex items-center justify-center text-transformative-teal mb-4 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h5 className="font-serif font-bold text-deep-indigo text-base mb-2">
            {t('trustItemSafetyTitle', locale)}
          </h5>
          <p className="text-xs text-deep-indigo/70 font-light leading-relaxed">
            {t('trustItemSafetyDesc', locale)}
          </p>
        </div>

        {/* Pillar 3: Sighting Guarantee */}
        <div className="flex flex-col items-center text-center p-4 rounded-3xl hover:bg-cloud-dancer/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-transformative-teal/10 flex items-center justify-center text-transformative-teal mb-4 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <h5 className="font-serif font-bold text-deep-indigo text-base mb-2">
            {t('trustItemSightingTitle', locale)}
          </h5>
          <p className="text-xs text-deep-indigo/70 font-light leading-relaxed">
            {t('trustItemSightingDesc', locale)}
          </p>
        </div>

        {/* Pillar 4: Secure Stripe */}
        <div className="flex flex-col items-center text-center p-4 rounded-3xl hover:bg-cloud-dancer/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-transformative-teal/10 flex items-center justify-center text-transformative-teal mb-4 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h5 className="font-serif font-bold text-deep-indigo text-base mb-2">
            {t('trustItemPaymentTitle', locale)}
          </h5>
          <p className="text-xs text-deep-indigo/70 font-light leading-relaxed">
            {t('trustItemPaymentDesc', locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
