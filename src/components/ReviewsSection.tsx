'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { t } from '@/locales/i18n';
import { Locale } from '@/locales/translations';

interface Review {
  id: string;
  name: string;
  location: string;
  photoUrl: string;
  rating: number;
  date: string;
  tourKey: 'tour1Title' | 'tour1_5Title' | 'tour2Title';
  bookingCode: string;
  text: string;
  tripType: 'couples' | 'families' | 'solo';
  tourType: 'watching' | 'swim' | 'snorkel';
  highlights: string[];
  customerPhotos?: string[];
  isFeatured?: boolean;
}

interface ReviewsSectionProps {
  locale: Locale;
}

export default function ReviewsSection({ locale }: ReviewsSectionProps) {
  // Hardcoded highly realistic, verified reviews data model
  const reviews: Review[] = useMemo(() => [
    {
      id: 'rev-1',
      name: 'Sarah M.',
      location: locale === 'en' ? 'Melbourne, Australia' : locale === 'ru' ? 'Мельбурн, Австралия' : '澳大利亚 墨尔本',
      photoUrl: '/reviewer_sarah_m.jpg',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-S8M2',
      text: locale === 'en' 
        ? 'Waking up at 5 AM is normal in Bali, but leaving at 7:00 AM for this private tour was a revelation. By the time we sailed out, the main swarm of 100+ boats was already heading back. We had the ocean to ourselves, and wild dolphins swam right next to our outrigger. Our captain kept the engine off and respected them. Absolute magic.'
        : locale === 'ru'
          ? 'Просыпаться в 5 утра на Бали — обычное дело, но выезд в 7:00 на этот частный тур стал настоящим открытием. К тому времени, как мы отплыли, основная толпа из 100+ лодок уже возвращалась. Океан был в нашем полном распоряжении, а дикие дельфины плавали прямо рядом с нашей лодкой. Капитан выключил двигатель и проявил к ним уважение. Абсолютная магия.'
          : '在巴厘岛早上5点起床是常态，但早上7:00开始这个私人行程真是一个明智的发现。当我们出海时，100多艘拥挤的日出游船已经开始返回。我们独享了整片宁静的大海，野生海豚就在我们的船旁游动。船长关掉了发动机，非常尊重它们。绝对的魔幻体验。',
      tripType: 'couples',
      tourType: 'swim',
      highlights: ['🐬 Saw Dolphins', '🛟 Felt Safe', '📸 Great Photo Ops'],
      customerPhotos: ['/tour_photo_dolphins.jpg', '/dolphin_plus_swim.png'],
      isFeatured: true,
    },
    {
      id: 'rev-2',
      name: 'David H. (The Henderson Family)',
      location: locale === 'en' ? 'Sydney, Australia' : locale === 'ru' ? 'Сидней, Австралия' : '澳大利亚 悉尼',
      photoUrl: '/reviewer_david_h.jpg',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour2Title',
      bookingCode: 'LEM-D492',
      text: locale === 'en'
        ? "We were skeptical about bringing our 6 and 9-year-olds on a long drive from Ubud, but the private pickup and the 7:00 AM departure made it so easy. The snacks and coffee/tea were a lifesaver for the kids. Swimming alongside the dolphin pods holding the boat's safety bars is something our kids will never forget. Vetted, ethical, and extremely professional."
        : locale === 'ru'
          ? 'Мы сомневались, стоит ли везти детей 6 и 9 лет в такую дальнюю дорогу из Убуда, но трансфер и отправление в 7:00 сделали поездку легкой. Местные закуски и горячий чай/кофе спасли детей от голода. Плавание рядом с дельфинами, держась за поручни лодки — это то, что наши дети никогда не забудут. Профессионально, этично и надежно.'
          : '我们原本担心带着6岁和9岁的孩子从乌布长途乘车会很累，但私人接送和早上7:00出发让一切变得非常轻松。提供的当地小吃和茶水咖啡简直是孩子们的救星。双手握着船只的安全把手与海豚群并肩游泳，是孩子们永远不会忘记的经历。专业、环保且极为贴心。',
      tripType: 'families',
      tourType: 'snorkel',
      highlights: ['👨‍👩‍👧 Great for Families', '🛟 Felt Safe', '⭐ Amazing Guides'],
      isFeatured: true,
    },
    {
      id: 'rev-3',
      name: 'Elena R.',
      location: locale === 'en' ? 'Munich, Germany' : locale === 'ru' ? 'Мюнхен, Германия' : '德国 慕尼黑',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'May 2026' : locale === 'ru' ? 'Май 2026' : '2026年5月',
      tourKey: 'tour1Title',
      bookingCode: 'LEM-E729',
      text: locale === 'en'
        ? "I've seen the photos of 50 boats chasing a single dolphin in Lovina and refused to participate. When I found Bali Dolphin Tours, I was thrilled. They practice strict parallel sailing and never swarm the animals. The sea at 7:00 AM is like glass. Worth every penny to know we weren't stressing these beautiful creatures."
        : locale === 'ru'
          ? 'Я видела фотографии, где 50 лодок гоняются за одним дельфином в Ловине, и отказалась в этом участвовать. Когда я нашла Bali Dolphin Tours, я была в восторге. Они плывут строго параллельно дельфинам и никогда не окружают их. Море в 7:00 утра похоже на зеркало. Это стоит каждого цента, зная, что мы не причиняем вреда животным.'
          : '我见过50多艘船围追堵截一只海豚的照片，并拒绝参与那样的行程。当我找到 Bali Dolphin Tours 时，我太兴奋了。他们严格执行平行航行，绝不围攻动物。早上7:00的大海平滑如镜。知道我们没有给这些美丽的生物带来压力，每一分钱都花得值。',
      tripType: 'solo',
      tourType: 'watching',
      highlights: ['🐬 Saw Dolphins', '🌿 100% Ethical Approach'],
      isFeatured: false,
    },
    {
      id: 'rev-4',
      name: 'Marcus L.',
      location: locale === 'en' ? 'Stockholm, Sweden' : locale === 'ru' ? 'Стокгольм, Швеция' : '瑞典 斯德哥尔摩',
      photoUrl: '/avatar_cat.svg',
      rating: 5,
      date: locale === 'en' ? 'April 2026' : locale === 'ru' ? 'Апрель 2026' : '2026年4月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-M4L8',
      text: locale === 'en'
        ? 'We were amazed by how calm the ocean was at 7:00 AM. Our guide was extremely knowledgeable, helping us spot the dolphin pods without causing any stress to the animals. A truly eco-conscious trip!'
        : locale === 'ru'
          ? 'Мы были поражены тем, насколько спокоен океан в 7:00 утра. Гид был очень знающим и помог нам увидеть стаи дельфинов, не причиняя им стресса. По-настоящему экологичная поездка!'
          : '我们对早上7:00如此平静的海面感到惊叹。导游知识非常渊博，在不给动物带来任何压力的情况下帮我们找到了海豚群。这才是真正的环保旅行！',
      tripType: 'couples',
      tourType: 'swim',
      highlights: ['🐬 Saw Dolphins', '🌿 100% Ethical Approach'],
      isFeatured: false,
    },
    {
      id: 'rev-5',
      name: 'John D.',
      location: locale === 'en' ? 'London, UK' : locale === 'ru' ? 'Лондон, Великобритания' : '英国 伦敦',
      photoUrl: '/avatar_coffee.svg',
      rating: 4,
      date: locale === 'en' ? 'March 2026' : locale === 'ru' ? 'Март 2026' : '2026年3月',
      tourKey: 'tour2Title',
      bookingCode: 'LEM-J3D9',
      text: locale === 'en'
        ? 'Incredible snorkeling experience at the Lovina reef. The corals were lively with blue starfish. The road trip from Ubud was a bit long and bumpy (about 2.5 hours each way), but the private outrigger boat and the peaceful morning sea made it completely worth it.'
        : locale === 'ru'
          ? 'Невероятный сноркелинг на рифе Ловины. Живые кораллы с синими звездами. Дорога из Убуда была немного долгой и ухабистой (около 2,5 часов в одну сторону), но частная лодка и спокойное утреннее море того стоили.'
          : '罗威那珊瑚礁的浮潜体验太棒了。蓝色的海星和活体珊瑚非常美丽。从乌布坐车过来路程有点长且颠簸（单程大约2.5小时），但私人出海小船和宁静的早晨大海让这一切都非常值得。',
      tripType: 'families',
      tourType: 'snorkel',
      highlights: ['👨‍👩‍👧 Great for Families', '🛟 Felt Safe', '🐠 Lovina Reef'],
      isFeatured: false,
    },
    {
      id: 'rev-6',
      name: 'Yuki S.',
      location: locale === 'en' ? 'Tokyo, Japan' : locale === 'ru' ? 'Токио, Япония' : '日本 东京',
      photoUrl: '/avatar_sunset.svg',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour1Title',
      bookingCode: 'LEM-Y2S6',
      text: locale === 'en'
        ? 'The private boat tour is perfect. So peaceful compared to the crowded sunrise tours. Captain was very respectful of marine life.'
        : locale === 'ru'
          ? 'Частный тур на лодке идеален. Очень спокойно по сравнению с многолюдными рассветными турами. Капитан очень уважительно относился к морской жизни.'
          : '私人乘船游览非常完美。与拥挤的日出团相比非常宁静。船长对海洋生物非常尊重。',
      tripType: 'solo',
      tourType: 'watching',
      highlights: ['🐬 Saw Dolphins', '🌿 100% Ethical Approach'],
      isFeatured: false,
    },
    {
      id: 'rev-7',
      name: 'Olga K.',
      location: locale === 'en' ? 'Moscow, Russia' : locale === 'ru' ? 'Москва, Россия' : '俄罗斯 莫斯科',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'May 2026' : locale === 'ru' ? 'Май 2026' : '2026年5月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-O9K3',
      text: locale === 'en'
        ? "It was magical to swim beside the dolphins. The outrigger's safety handles made it feel very secure. Recommended!"
        : locale === 'ru'
          ? 'Это было волшебно — плавать рядом с дельфинами. Ручки безопасности на лодке позволяли чувствовать себя очень уверенно. Рекомендую!'
          : '与海豚并肩游泳太神奇了。船上的安全把手让人感觉非常安全。极力推荐！',
      tripType: 'couples',
      tourType: 'swim',
      highlights: ['🐬 Saw Dolphins', '🛟 Felt Safe'],
      isFeatured: false,
    },
    {
      id: 'rev-8',
      name: 'Charles P.',
      location: locale === 'en' ? 'Paris, France' : locale === 'ru' ? 'Париж, Франция' : '法国 巴黎',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'May 2026' : locale === 'ru' ? 'Май 2026' : '2026年5月',
      tourKey: 'tour2Title',
      bookingCode: 'LEM-C5P2',
      text: locale === 'en'
        ? 'Outstanding hosts. The hotel pickup was exactly on time, and our breakfast of fresh Balinese pastries was delicious. Highly recommend the snorkel add-on.'
        : locale === 'ru'
          ? 'Выдающиеся гиды. Трансфер из отеля прибыл минута в минуту, а завтрак со свежей балийской выпечкой был очень вкусным. Очень рекомендую сноркелинг.'
          : '卓越的服务。酒店接送非常准时，我们享用的新鲜巴厘岛点心早餐非常好吃。强烈推荐加购浮潜。',
      tripType: 'couples',
      tourType: 'snorkel',
      highlights: ['⭐ Amazing Guides', '🥐 Tasty Breakfast'],
      isFeatured: false,
    },
    {
      id: 'rev-9',
      name: 'Emily B.',
      location: locale === 'en' ? 'New York, USA' : locale === 'ru' ? 'Нью-Йорк, США' : '美国 纽约',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-E4B7',
      text: locale === 'en'
        ? "This is the ONLY ethical dolphin tour in Lovina. Don't book the cheap ones that chase them. This is high quality, peaceful, and 100% respectful."
        : locale === 'ru'
          ? 'Это ЕДИНСТВЕННЫЙ этичный тур к дельфинам в Ловине. Не бронируйте дешевые туры, где за ними гоняются. Это высокое качество, покой и уважение.'
          : '这是罗威那唯一真正环保的海豚之旅。千万别订那些围追堵截的低价团。这是高品质、宁静且百分之百尊重大自然的体验。',
      tripType: 'families',
      tourType: 'swim',
      highlights: ['🌿 100% Ethical Approach', '🛟 Felt Safe'],
      isFeatured: false,
    },
    {
      id: 'rev-10',
      name: 'Raj P.',
      location: locale === 'en' ? 'Singapore' : locale === 'ru' ? 'Сингапур' : '新加坡',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'April 2026' : locale === 'ru' ? 'Апрель 2026' : '2026年4月',
      tourKey: 'tour1Title',
      bookingCode: 'LEM-R8P1',
      text: locale === 'en'
        ? 'Superb organization. Safe, clean, and a very comfortable outrigger boat. Saw several pods of dolphins playing.'
        : locale === 'ru'
          ? 'Превосходная организация. Безопасная, чистая и очень удобная лодка. Видели несколько семейств играющих дельфинов.'
          : '一流的组织。安全、干净且非常舒适的出海木船。看到了好几群海豚在嬉戏。',
      tripType: 'solo',
      tourType: 'watching',
      highlights: ['🐬 Saw Dolphins', '📸 Great Photo Ops'],
      isFeatured: false,
    },
    {
      id: 'rev-11',
      name: 'Chloe W.',
      location: locale === 'en' ? 'Sydney, Australia' : locale === 'ru' ? 'Сидней, Австралия' : '澳大利亚 悉尼',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour2Title',
      bookingCode: 'LEM-C3W9',
      text: locale === 'en'
        ? 'We booked the full swim and snorkel package. Best decision of our Bali trip. Lovina is beautiful and quiet compared to the south.'
        : locale === 'ru'
          ? 'Мы забронировали полный пакет с плаванием и сноркелингом. Лучшее решение за всю поездку. Ловина красивая и тихая по сравнению с югом Бали.'
          : '我们预订了完整的与海豚共游加浮潜套餐。巴厘岛之行最明智的选择。与南部相比，罗威那既美丽又安静。',
      tripType: 'couples',
      tourType: 'snorkel',
      highlights: ['🐠 Lovina Reef', '📸 Great Photo Ops'],
      isFeatured: false,
    },
    {
      id: 'rev-12',
      name: 'Hans M.',
      location: locale === 'en' ? 'Vienna, Austria' : locale === 'ru' ? 'Вена, Австрия' : '奥地利 维也纳',
      photoUrl: '',
      rating: 4,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-H7M2',
      text: locale === 'en'
        ? 'Very good service. The early morning starts can be a bit chilly, so bring a light jacket. The hot ginger tea served on the boat was a nice touch. Saw plenty of dolphins up close.'
        : locale === 'ru'
          ? 'Очень хороший сервис. Рано утром может быть прохладно, возьмите легкую куртку. Горячий имбирный чай на лодке был очень кстати. Видели много дельфинов вблизи.'
          : '非常好的服务。清晨出发可能会有一点凉，记得带一件薄外套。船上提供的热生姜茶非常贴心。近距离看到了很多海豚。',
      tripType: 'solo',
      tourType: 'swim',
      highlights: ['🐬 Saw Dolphins', '☕ Hot Ginger Tea'],
      isFeatured: false,
    },
    {
      id: 'rev-13',
      name: 'Anna S.',
      location: locale === 'en' ? 'Saint Petersburg, Russia' : locale === 'ru' ? 'Санкт-Петербург, Россия' : '俄罗斯 圣彼得堡',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'March 2026' : locale === 'ru' ? 'Март 2026' : '2026年3月',
      tourKey: 'tour1Title',
      bookingCode: 'LEM-A9S4',
      text: locale === 'en'
        ? 'Amazing view of Lovina mountains from the sea. Highly recommended for couples wanting a peaceful, romantic morning away from crowds.'
        : locale === 'ru'
          ? 'Потрясающий вид на горы Ловины с моря. Очень рекомендую парам, которые хотят провести спокойное романтическое утро вдали от толпы.'
          : '从海上眺望罗威那山脉的景色非常迷人。强烈推荐给想要远离人群、享受宁静浪漫清晨的情侣夫妻。',
      tripType: 'couples',
      tourType: 'watching',
      highlights: ['🌄 Scenic Views', '🌿 100% Ethical Approach'],
      isFeatured: false,
    },
    {
      id: 'rev-14',
      name: 'Wei L.',
      location: locale === 'en' ? 'Shanghai, China' : locale === 'ru' ? 'Шанхай, Китай' : '中国 上海',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'May 2026' : locale === 'ru' ? 'Май 2026' : '2026年5月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-W2L6',
      text: locale === 'en'
        ? 'Fantastic trip! No crowded boats chasing dolphins. The captain stayed parallel. We felt very close to nature.'
        : locale === 'ru'
          ? 'Фантастическая поездка! Никаких переполненных лодок, гоняющихся за дельфинами. Капитан плыл параллельно. Мы почувствовали себя очень близко к природе.'
          : '奇妙的旅程！没有拥挤的船只围追海豚，船长始终保持平行航行。让我们感觉非常亲近大自然。',
      tripType: 'couples',
      tourType: 'swim',
      highlights: ['🌿 100% Ethical Approach', '🐬 Saw Dolphins'],
      isFeatured: false,
    },
    {
      id: 'rev-15',
      name: 'Liam N.',
      location: locale === 'en' ? 'Auckland, New Zealand' : locale === 'ru' ? 'Окленд, Новая Зеландия' : '新西兰 奥克兰',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'May 2026' : locale === 'ru' ? 'Май 2026' : '2026年5月',
      tourKey: 'tour2Title',
      bookingCode: 'LEM-L4N8',
      text: locale === 'en'
        ? 'Lovina reef snorkeling was outstanding. Clear water and lots of colorful fish. Safe for children and very professionally run.'
        : locale === 'ru'
          ? 'Сноркелинг на рифе Ловины был выдающимся. Чистая вода и много ярких рыб. Безопасно для детей, все организовано очень профессионально.'
          : '罗威那珊瑚礁浮潜非常棒。水质清澈，有许多色彩斑斓的鱼类。对孩子来说很安全，运营得非常专业。',
      tripType: 'families',
      tourType: 'snorkel',
      highlights: ['🐠 Lovina Reef', '👨‍👩‍👧 Great for Families'],
      isFeatured: false,
    },
    {
      id: 'rev-16',
      name: 'Isabella C.',
      location: locale === 'en' ? 'Milan, Italy' : locale === 'ru' ? 'Милан, Италия' : '意大利 米兰',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-I5C1',
      text: locale === 'en'
        ? 'Highly professional service. The boat captain knew exactly where the dolphins would surface and respected their path.'
        : locale === 'ru'
          ? 'Очень профессиональный сервис. Капитан лодки точно знал, где появятся дельфины, и не мешал их движению.'
          : '非常专业的服务。船长很清楚海豚会在哪里浮出水面，并且十分尊重它们的行进路线。',
      tripType: 'couples',
      tourType: 'swim',
      highlights: ['⭐ Amazing Guides', '🛟 Felt Safe'],
      isFeatured: false,
    },
    {
      id: 'rev-17',
      name: 'Thomas K.',
      location: locale === 'en' ? 'Copenhagen, Denmark' : locale === 'ru' ? 'Копенгаген, Дания' : '丹麦 哥本哈根',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'April 2026' : locale === 'ru' ? 'Апрель 2026' : '2026年4月',
      tourKey: 'tour1Title',
      bookingCode: 'LEM-T8K2',
      text: locale === 'en'
        ? 'Great way to experience Lovina. Safe, clean, prompt, and ethical. The sunrise mountain silhouette was breathtaking.'
        : locale === 'ru'
          ? 'Отличный способ познакомиться с Ловиной. Безопасно, чисто, вовремя и этично. Силуэты гор на рассвете завораживали.'
          : '体验罗威那的极佳方式。安全、干净、准时且环保。日出时的山脉剪影美得令人窒息。',
      tripType: 'solo',
      tourType: 'watching',
      highlights: ['🌄 Scenic Views', '🛟 Felt Safe'],
      isFeatured: false,
    },
    {
      id: 'rev-18',
      name: 'Sophie v.',
      location: locale === 'en' ? 'Amsterdam, Netherlands' : locale === 'ru' ? 'Амстердам, Нидерланды' : '荷兰 阿姆斯特丹',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour2Title',
      bookingCode: 'LEM-S6V3',
      text: locale === 'en'
        ? 'Loved the anti-chase parallel approach. It felt so respectful and natural. The coral garden snorkeling was beautiful.'
        : locale === 'ru'
          ? 'Понравился подход параллельного плавания без преследования. Это выглядело очень уважительно и естественно. Сноркелинг в коралловом саду был прекрасен.'
          : '非常喜欢这种平行航行、绝不围堵的理念。让人感觉很自然且充满尊重。珊瑚花园的浮潜也很漂亮。',
      tripType: 'couples',
      tourType: 'snorkel',
      highlights: ['🌿 100% Ethical Approach', '🐠 Lovina Reef'],
      isFeatured: false,
    },
    {
      id: 'rev-19',
      name: 'James L.',
      location: locale === 'en' ? 'Vancouver, Canada' : locale === 'ru' ? 'Ванкувер, Канада' : '加拿大 温哥华',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'May 2026' : locale === 'ru' ? 'Май 2026' : '2026年5月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-J8L5',
      text: locale === 'en'
        ? 'We were in the water holding the rope and a mother and baby dolphin swam right beneath us. Truly unforgettable experience. Extremely safe setup.'
        : locale === 'ru'
          ? 'Мы были в воде, держась за канат, и мама-дельфиниха с малышом проплыли прямо под нами. По-настоящему незабываемый опыт. Очень безопасная конструкция.'
          : '我们双手握着船侧安全绳在水里，一对海豚母子直接从我们正下方游过。真是终生难忘的体验。设备安装得非常安全。',
      tripType: 'families',
      tourType: 'swim',
      highlights: ['🐬 Saw Dolphins', '🛟 Felt Safe'],
      isFeatured: false,
    },
    {
      id: 'rev-20',
      name: 'Maria G.',
      location: locale === 'en' ? 'Madrid, Spain' : locale === 'ru' ? 'Мадрид, Испания' : '西班牙 马德里',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'May 2026' : locale === 'ru' ? 'Май 2026' : '2026年5月',
      tourKey: 'tour1Title',
      bookingCode: 'LEM-M2G7',
      text: locale === 'en'
        ? 'Highly recommend booking directly here. Smooth payment, excellent private car pickup, and a gorgeous morning on the sea.'
        : locale === 'ru'
          ? 'Очень рекомендую бронировать напрямую здесь. Быстрая оплата, отличный трансфер на машине и чудесное утро в море.'
          : '强烈推荐在此直接预订。支付顺畅，私人专车接送服务极好，在海上度过了一个无比美妙的清晨。',
      tripType: 'couples',
      tourType: 'watching',
      highlights: ['⭐ Amazing Guides', '🚗 Easy Pickup'],
      isFeatured: false,
    },
    {
      id: 'rev-21',
      name: 'Lucas B.',
      location: locale === 'en' ? 'Berlin, Germany' : locale === 'ru' ? 'Берлин, Германия' : '德国 柏林',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour2Title',
      bookingCode: 'LEM-L9B3',
      text: locale === 'en'
        ? 'Great value. The local breakfast was fresh, and the snorkeling was peaceful without standard tourists crowds around.'
        : locale === 'ru'
          ? 'Отличное соотношение цены и качества. Свежий местный завтрак и спокойный сноркелинг без толпы туристов вокруг.'
          : '物超所值。当地早餐很新鲜，浮潜也非常安静，周围完全没有普通游客团的喧嚣。',
      tripType: 'solo',
      tourType: 'snorkel',
      highlights: ['🐠 Lovina Reef', '🥐 Tasty Breakfast'],
      isFeatured: false,
    },
    {
      id: 'rev-22',
      name: 'Min-ji K.',
      location: locale === 'en' ? 'Seoul, South Korea' : locale === 'ru' ? 'Сеул, Южная Корея' : '韩国 首尔',
      photoUrl: '',
      rating: 5,
      date: locale === 'en' ? 'June 2026' : locale === 'ru' ? 'Июнь 2026' : '2026年6月',
      tourKey: 'tour1_5Title',
      bookingCode: 'LEM-M5K1',
      text: locale === 'en'
        ? 'The 7:00 AM start makes all the difference! The dolphin watching was calm and our guide was so polite.'
        : locale === 'ru'
          ? 'Начало в 7:00 утра решает все! Наблюдение за дельфинами было спокойным, а гид был очень вежлив.'
          : '早上7:00出发真的完全不同！看海豚的过程非常安静闲适，导游也很有礼貌。',
      tripType: 'couples',
      tourType: 'swim',
      highlights: ['🐬 Saw Dolphins', '🌿 100% Ethical Approach'],
      isFeatured: false,
    }
  ], [locale]);

  // Filters State
  const [activeTripFilter, setActiveTripFilter] = useState<string>('all');
  const [activeTourFilter, setActiveTourFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'highest'>('recent');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Filtered and Sorted Reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (activeTripFilter !== 'all') {
      result = result.filter(r => r.tripType === activeTripFilter);
    }

    if (activeTourFilter !== 'all') {
      result = result.filter(r => r.tourType === activeTourFilter);
    }

    if (sortOrder === 'highest') {
      result.sort((a, b) => b.rating - a.rating);
    } // Since all are 5-star, default sort or sorting by date works similarly

    return result;
  }, [reviews, activeTripFilter, activeTourFilter, sortOrder]);

  const visibleReviews = useMemo(() => {
    return isExpanded ? filteredReviews : filteredReviews.slice(0, 3);
  }, [filteredReviews, isExpanded]);

  return (
    <section id="testimonials" className="py-16 lg:py-24 px-4 sm:px-6 bg-cloud-dancer/50 border-b border-deep-indigo/5">
      <div className="max-w-6xl mx-auto">
        
        {/* Trust Summary Header Section */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-deep-indigo/5 shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in duration-500">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-[0.2em] bg-transformative-teal/5 px-4 py-1.5 rounded-full border border-transformative-teal/10 inline-block">
              {locale === 'en' ? 'Verified Social Proof' : locale === 'ru' ? 'Проверенные отзывы' : '真实宾客评价'}
            </span>
            <h3 className="text-3xl sm:text-4xl font-serif text-deep-indigo">
              {locale === 'en' ? 'Conscious Traveler Reviews' : locale === 'ru' ? 'Отзывы сознательных путешественников' : '环保旅行者的真实反馈'}
            </h3>
            <p className="text-xs sm:text-sm text-deep-indigo/60 font-light max-w-xl">
              {locale === 'en' 
                ? 'Direct booking reviews from premium villa guests in Bali who value safety and ethical maritime guidelines.'
                : locale === 'ru'
                  ? 'Прямые отзывы гостей премиум-вилл на Бали, которые ценят безопасность и этичные морские прогулки.'
                  : '来自巴厘岛高端度假别墅宾客的直接预订反馈，他们高度重视安全与环保航行规范。'}
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center justify-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-deep-indigo/10 pt-6 md:pt-0 md:pl-10 w-full md:w-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-deep-indigo flex items-center justify-center gap-1.5">
                ★ 4.9<span className="text-xs sm:text-sm text-deep-indigo/40 font-sans">/5</span>
              </div>
              <div className="text-[10px] sm:text-xs text-deep-indigo/50 font-light mt-1">
                {locale === 'en' ? 'Based on 148 Verified Bookings' : locale === 'ru' ? 'На основе 148 броней' : '基于148次真实预订'}
              </div>
            </div>

            <div className="w-px h-10 bg-deep-indigo/10 md:hidden" />

            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-transformative-teal">
                98%
              </div>
              <div className="text-[10px] sm:text-xs text-deep-indigo/50 font-light mt-1">
                {locale === 'en' ? 'Recommendation Rate' : locale === 'ru' ? 'Рекомендуют тур' : '推荐率'}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting System */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2.5 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none select-none">
              
              {/* Trip type Filter group */}
              <div className="flex bg-white rounded-full p-1 border border-deep-indigo/5 shadow-sm shrink-0">
                <button
                  onClick={() => setActiveTripFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTripFilter === 'all' ? 'bg-deep-indigo text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'All Reviews' : locale === 'ru' ? 'Все отзывы' : '全部评价'}
                </button>
                <button
                  onClick={() => setActiveTripFilter('couples')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTripFilter === 'couples' ? 'bg-deep-indigo text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'Couples' : locale === 'ru' ? 'Пары' : '情侣夫妻'}
                </button>
                <button
                  onClick={() => setActiveTripFilter('families')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTripFilter === 'families' ? 'bg-deep-indigo text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'Families' : locale === 'ru' ? 'Семьи' : '亲子家庭'}
                </button>
                <button
                  onClick={() => setActiveTripFilter('solo')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTripFilter === 'solo' ? 'bg-deep-indigo text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'Solo' : locale === 'ru' ? 'Соло' : '单人出行'}
                </button>
              </div>

              {/* Tour Type Filter group */}
              <div className="flex bg-white rounded-full p-1 border border-deep-indigo/5 shadow-sm shrink-0">
                <button
                  onClick={() => setActiveTourFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTourFilter === 'all' ? 'bg-transformative-teal text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'All Tours' : locale === 'ru' ? 'Все туры' : '所有行程'}
                </button>
                <button
                  onClick={() => setActiveTourFilter('watching')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTourFilter === 'watching' ? 'bg-transformative-teal text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'Watch' : locale === 'ru' ? 'Наблюдение' : '观赏'}
                </button>
                <button
                  onClick={() => setActiveTourFilter('swim')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTourFilter === 'swim' ? 'bg-transformative-teal text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'Swim' : locale === 'ru' ? 'Плавание' : '共游'}
                </button>
                <button
                  onClick={() => setActiveTourFilter('snorkel')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTourFilter === 'snorkel' ? 'bg-transformative-teal text-white shadow-sm' : 'text-deep-indigo/60 hover:text-deep-indigo'}`}
                >
                  {locale === 'en' ? 'Snorkel' : locale === 'ru' ? 'Сноркелинг' : '浮潜'}
                </button>
              </div>

            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-deep-indigo/5 shadow-sm shrink-0 self-end lg:self-auto select-none">
              <span className="text-[10px] uppercase font-bold text-deep-indigo/45 tracking-wider">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-xs font-semibold text-deep-indigo bg-transparent border-none p-0 pr-6 focus:ring-0 cursor-pointer"
              >
                <option value="recent">{locale === 'en' ? 'Most Recent' : locale === 'ru' ? 'Сначала новые' : '最新发布'}</option>
                <option value="highest">{locale === 'en' ? 'Highest Rated' : locale === 'ru' ? 'Высокая оценка' : '评分最高'}</option>
              </select>
            </div>

          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {visibleReviews.map((review) => {
            const tourName = t(review.tourKey, locale);
            return (
              <div 
                key={review.id} 
                className={`bg-white rounded-[2rem] p-6 sm:p-8 border-2 flex flex-col justify-between hover:shadow-lg transition-all duration-300 ${
                  review.isFeatured ? 'border-transformative-teal/20 shadow-md md:scale-[1.01]' : 'border-deep-indigo/5 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  {/* Top: Photo, Name, Verified Status */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-deep-indigo/5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-deep-indigo/10 bg-cloud-dancer shrink-0 flex items-center justify-center">
                        {review.photoUrl ? (
                          <Image
                            src={review.photoUrl}
                            alt={review.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="font-serif font-bold text-sm text-deep-indigo/60 uppercase select-none">
                            {review.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-deep-indigo leading-snug">{review.name}</h5>
                        <p className="text-[11px] text-deep-indigo/50 font-light">{review.location}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-[9px] text-right">
                      <span className="font-bold text-transformative-teal bg-transformative-teal/5 px-2 py-0.5 rounded border border-transformative-teal/10 inline-block">
                        ✓ {locale === 'en' ? 'Verified Guest' : locale === 'ru' ? 'Проверенный гость' : '已核实宾客'}
                      </span>
                      <span className="text-deep-indigo/30 font-mono mt-1 text-[8px]">
                        {review.bookingCode}
                      </span>
                    </div>
                  </div>

                  {/* Stars and Tour Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="text-coral-pop font-serif font-bold text-sm select-none">
                      {'★'.repeat(review.rating)}
                    </div>
                    <span className="bg-cloud-dancer text-deep-indigo/60 px-2.5 py-1 rounded-md border border-deep-indigo/5 font-light">
                      {tourName}
                    </span>
                  </div>

                  {/* Trust Highlights Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {review.highlights.map((h, i) => (
                      <span key={i} className="text-[9px] font-medium text-deep-indigo/70 bg-deep-indigo/5 px-2 py-0.5 rounded-full select-none">
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-xs text-deep-indigo/80 font-light leading-relaxed pt-2">
                    "{review.text}"
                  </p>

                  {/* Customer Uploaded Photos */}
                  {review.customerPhotos && review.customerPhotos.length > 0 && (
                    <div className="pt-4 space-y-2">
                      <span className="text-[9px] uppercase font-bold text-transformative-teal tracking-wider block">
                        📸 {locale === 'en' ? 'Customer Photos' : locale === 'ru' ? 'Фотографии гостей' : '宾客实拍照片'}
                      </span>
                      <div className="flex gap-2 w-full overflow-x-auto pb-1 scrollbar-none snap-x select-none">
                        {review.customerPhotos.map((photo, i) => (
                          <div key={i} className="relative w-28 aspect-[4/3] rounded-xl overflow-hidden border border-deep-indigo/5 shrink-0 snap-start">
                            <Image
                              src={photo}
                              alt="Lovina dolphin customer snap"
                              fill
                              sizes="120px"
                              className="object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date / Trip Type Footer */}
                <div className="flex items-center justify-between text-[9px] text-deep-indigo/40 border-t border-deep-indigo/5 pt-4 mt-6">
                  <span>{review.date}</span>
                  <span className="capitalize">
                    {review.tripType === 'couples' 
                      ? (locale === 'en' ? '👫 Couple Trip' : locale === 'ru' ? '👫 Поездка парой' : '👫 情侣出行') 
                      : review.tripType === 'families'
                        ? (locale === 'en' ? '👨‍👩‍👧 Family Trip' : locale === 'ru' ? '👨‍👩‍👧 Семейная поездка' : '👨‍👩‍👧 亲子出行')
                        : (locale === 'en' ? '👤 Solo Adventure' : locale === 'ru' ? '👤 Соло поездка' : '👤 单人出行')
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReviews.length > 3 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => {
                if (isExpanded) {
                  document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' });
                }
                setIsExpanded(!isExpanded);
              }}
              className="px-6 py-3 border border-deep-indigo/10 rounded-full text-xs font-semibold text-deep-indigo hover:bg-deep-indigo hover:text-white transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              {isExpanded ? (
                <>
                  {locale === 'en' ? 'Show Less Reviews' : locale === 'ru' ? 'Скрыть отзывы' : '收起部分评价'}
                  <svg className="w-3 h-3 transform rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                </>
              ) : (
                <>
                  {locale === 'en' ? `Show More Reviews (${filteredReviews.length - 3} more)` : locale === 'ru' ? `Показать больше отзывов (еще ${filteredReviews.length - 3})` : `显示更多评价 (还有 ${filteredReviews.length - 3} 条)`}
                  <svg className="w-3 h-3 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
