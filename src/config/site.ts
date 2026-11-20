// Novesta brand logo served from /public/assets/aistudio/Novesta_72b3be73.png

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  outcome: string;
  iconName:
    | 'Globe'
    | 'ShoppingBag'
    | 'Share2'
    | 'Search'
    | 'MapPin'
    | 'Layers'
    | 'Bot';
}

export interface IndustryItem {
  id: string;
  name: string;
  outcome: string;
  example: string;
  iconName:
    | 'Building2'
    | 'UtensilsCrossed'
    | 'Coffee'
    | 'Store'
    | 'Stethoscope'
    | 'Rocket';
}

export interface ProcessStep {
  number: string;
  title: string;
  summary: string;
  deliverable: string;
}

export interface ResultStat {
  id: string;
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
  context: string;
  isPlaceholder: boolean;
}

export interface WhyNovestaPillar {
  title: string;
  description: string;
  metricNote: string;
  iconName: 'Code2' | 'Sparkles' | 'BarChart3' | 'Globe2';
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  business: string;
  industry: string;
  isPlaceholder: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FeaturePanelItem {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  preselectService: string;
}

export interface PricingPlan {
  id: string;
  tier: string;
  category: 'full-service' | 'website-only';
  name: string;
  badge?: string;
  billing: string;
  originalPrice: number;
  price: number;
  tagline: string;
  features: string[];
  cta: string;
  featured: boolean;
}

export interface PricingConfig {
  currency: string;
  locale: string;
  offerEndsOn: string;
  note: string;
  plans: PricingPlan[];
}

export interface ReachCity {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  summary: string;
  clients?: number;
  comingSoon?: number;
}

export interface ReachConfig {
  home: string;
  cities: ReachCity[];
}

export interface CareerRole {
  id: string;
  code: string;
  title: string;
  team: string;
  location: string;
}

export const siteConfig = {
  brand: {
    name: 'Novesta',
    tagline: 'Grow Online. Sell More. Rank Higher.',
    iconPath: '/assets/novesta-mark.webp',
    iconAlt: 'Novesta circular growth monogram logo',
    logoPath: '/assets/aistudio/Novesta_72b3be73.png',
    logoAlt: 'Novesta wordmark logo on black background',
    copyrightYear: 2026,
  },
  seo: {
    title: 'Novesta — Grow Online. Sell More. Rank Higher.',
    description:
      'Novesta takes offline businesses online with fast websites, ordering and booking systems, Google Maps optimization, SEO, and AI automation.',
    canonicalBaseUrl: 'https://novesta.online',
    ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    googleSiteVerification:
      import.meta.env.VITE_GSC_VERIFICATION || 'REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TOKEN',
  },
  contact: {
    phoneDisplay: '+91 8010927311',
    phoneHref: 'tel:+918010927311',
    whatsappNumber: '918010927311',
    whatsappUrl: 'https://wa.me/918010927311',
    whatsappPrefillText:
      'Hi Novesta, I would like a free digital growth consultation for my business.',
    email: 'hello@novesta.online',
    emailHref: 'mailto:hello@novesta.online',
    /**
     * Single config source for business address and Google Map coordinates.
     */
    address: {
      line1: '',
      city: 'Jalgaon',
      state: 'Maharashtra',
      postalCode: '424201',
      country: 'India',
      full: 'Jalgaon, Maharashtra – 424201',
      coordinates: {
        lat: 21.0077,
        lng: 75.5626,
      },
      googleMapsDirectUrl:
        'https://www.google.com/maps/search/?api=1&query=Jalgaon%2C+Maharashtra+424201',
    },
    businessHours: 'Mon – Sat · 9:30 AM – 7:30 PM IST',
  },
  socials: [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/novesta111?knvt=MWtpdm85eW5lem9iOQ==',
      handle: '@novesta111',
      isPlaceholder: false,
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/share/1A3YFYMYCE/',
      handle: 'Novesta',
      isPlaceholder: false,
    },
    {
      name: 'X',
      url: 'https://x.com/PawanRajput2005',
      handle: '@PawanRajput2005',
      isPlaceholder: false,
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/pawanrajput8010',
      handle: 'pawanrajput8010',
      isPlaceholder: false,
    },
  ],
  navLinks: [
    { label: 'Services', href: '#services' },
    { label: 'Reach', href: '#reach' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    headline: 'Grow online. Sell more. Rank higher.',
    subheadline:
      'Websites, direct ordering, Google ranking, and AI automation for local businesses.',
    primaryCta: 'Get Free Consultation',
    secondaryCta: 'WhatsApp Us',
    trustStats: [
      {
        value: '7',
        label: 'Core Growth Capabilities',
        detail: 'Web, Ordering, SEO, Maps, Social & AI under one roof',
      },
      {
        value: '2–4 wks',
        label: 'Typical Launch Window',
        detail: 'Placeholder delivery benchmark from kickoff to live site',
      },
      {
        value: '100%',
        label: 'Client Asset Ownership',
        detail: 'You own your domain, source code, and customer data',
      },
    ],
  },
  promise: {
    eyebrow: 'OUR STANDARD & GUARANTEE',
    line1: 'We build and deliver',
    line2: "the world's best",
    rotatingWords: [
      'websites.',
      'online stores.',
      'Google rankings.',
      'AI systems.',
      'business growth.',
    ],
    guaranteeHeadline: 'Built to increase your business—guaranteed execution on every launch.',
    guaranteeCopy:
      'From custom code and local Google Maps visibility to automated WhatsApp sales flows, we deliver engineering-grade digital systems focused purely on more customers, direct orders, and measurable growth.',
    commitments: [
      {
        code: '01',
        title: 'Engineered to convert',
        detail: 'Fast, mobile-first web products built for calls, bookings, and direct sales.',
      },
      {
        code: '02',
        title: 'Guaranteed delivery',
        detail: 'Clear scope, live progress, and committed support until every workflow performs.',
      },
      {
        code: '03',
        title: 'Built to grow revenue',
        detail: 'Search, Maps, social, and AI automation working together to scale your business.',
      },
    ],
  },
  featurePanels: [
    {
      id: 'websites-and-apps',
      title: 'Websites and apps',
      description: 'Fast, mobile-first sites and ordering systems.',
      ctaLabel: 'Get a Website',
      preselectService: 'Website and Web App Development',
    },
    {
      id: 'google-and-maps',
      title: 'Google and Maps ranking',
      description: 'Show up first when customers search near them.',
      ctaLabel: 'Get Ranked',
      preselectService: 'Google Maps & Business Profile Optimization',
    },
    {
      id: 'social-and-ai',
      title: 'Social and AI growth',
      description: 'Instagram, Facebook, X, plus chatbots and automation.',
      ctaLabel: 'Grow My Business',
      preselectService: 'AI and Automation',
    },
  ] as FeaturePanelItem[],
  pricing: {
    currency: '₹',
    locale: 'en-IN',
    offerEndsOn: '', // PLACEHOLDER: Optional ISO date (e.g. '2026-12-31'); deadline renders only if non-empty
    note: 'Instant online Razorpay checkout (UPI, Cards, NetBanking) or start with a free consultation. Transparent GST & domain terms shared upfront.',
    plans: [
      {
        id: 'large-business-all-services',
        tier: 'Large Business',
        category: 'full-service',
        name: 'Large Business · All Services',
        badge: 'Best value · 2 years',
        billing: 'for 2 years',
        originalPrice: 50000,
        price: 30000,
        tagline: 'Every service for 2 years, with your website built free.',
        features: [
          'Website & custom web app built free',
          'Full SEO, Google ranking & Google Maps dominance',
          'Social media marketing (Instagram, Facebook, X)',
          'Zomato, Swiggy, Booking.com, MakeMyTrip, JustDial sync',
          'AI chatbot, WhatsApp automation & analytics dashboard',
          'Dedicated 2-year support & business scaling',
        ],
        cta: 'Pay ₹30,000 Now',
        featured: true,
      },
      {
        id: 'medium-business-full-growth',
        tier: 'Medium Business',
        category: 'full-service',
        name: 'Medium Business · All Services & CRM',
        badge: '2-year management',
        billing: 'for 2 years',
        originalPrice: 25000,
        price: 17000,
        tagline:
          'All services, 2-year support, plus managing your overall business & customers.',
        features: [
          'Website + direct ordering or booking product included',
          'Customer management & automated WhatsApp follow-ups',
          'SEO, Google Maps & Business Profile optimization',
          'Social media growth & local directory alignment',
          '2-year complete business & customer operations support',
        ],
        cta: 'Pay ₹17,000 Now',
        featured: false,
      },
      {
        id: 'small-business-service-2yr',
        tier: 'Small Business',
        category: 'full-service',
        name: 'Small Business · Services & Support',
        badge: '2-year support',
        billing: 'for 2 years',
        originalPrice: 10000,
        price: 7000,
        tagline: 'Starter website plus essential growth services with 2-year support.',
        features: [
          'Fast mobile-first business website included',
          'Google Maps & Business Profile setup',
          'Essential local SEO & WhatsApp inquiry capture',
          '2-year priority technical support & content updates',
        ],
        cta: 'Pay ₹7,000 Now',
        featured: false,
      },
      {
        id: 'medium-business-website',
        tier: 'Medium Business',
        category: 'website-only',
        name: 'Medium Business · Website Only',
        badge: 'Reduced price',
        billing: 'one-time',
        originalPrice: 15000,
        price: 10000,
        tagline: 'Custom multi-page website or digital storefront reduced from ₹15,000 to ₹10,000.',
        features: [
          'Multi-page mobile-first responsive architecture',
          'Product catalog, menu, or booking inquiry flow',
          'Technical SEO, Schema markup & Google Map embed',
        ],
        cta: 'Pay ₹10,000 Now',
        featured: false,
      },
      {
        id: 'small-business-website',
        tier: 'Small / Low Business',
        category: 'website-only',
        name: 'Small Business · Website Only',
        billing: 'one-time',
        originalPrice: 5000,
        price: 5000,
        tagline: 'A fast, mobile-first starter website built and launched for local shops.',
        features: [
          'Clean mobile-first responsive business website',
          'SEO-ready setup & fast page loading',
          'Contact form, WhatsApp button & Google Map',
        ],
        cta: 'Pay ₹5,000 Now',
        featured: false,
      },
    ],
  } as PricingConfig,
  services: [
    {
      id: 'web-development',
      number: '01',
      title: 'Website and Web App Development',
      description:
        'Fast, mobile-first, SEO-ready websites and custom web applications engineered to convert visitors into calls, bookings, and orders.',
      outcome: '90+ Core Web Vitals · Mobile-first UX',
      iconName: 'Globe',
    },
    {
      id: 'online-product-building',
      number: '02',
      title: 'Online Product Building',
      description:
        'Direct ordering systems for restaurants, direct booking engines for hotels, and searchable digital catalogues and e-commerce stores for retail shops.',
      outcome: 'Commission-free direct orders & bookings',
      iconName: 'ShoppingBag',
    },
    {
      id: 'social-media-marketing',
      number: '03',
      title: 'Social Media Marketing',
      description:
        'Consistent content, reels, local ad campaigns, and audience growth across Instagram, Facebook, and X (Twitter) that drive real footfall and inquiries.',
      outcome: 'Targeted local reach · Measurable ad spend',
      iconName: 'Share2',
    },
    {
      id: 'seo-google-ranking',
      number: '04',
      title: 'SEO and Google Ranking',
      description:
        'Technical SEO, structured schema data, local landing pages, and search-focused content built to move your business website to the top of Google Search.',
      outcome: 'High-intent organic search traffic',
      iconName: 'Search',
    },
    {
      id: 'google-maps-gbp',
      number: '05',
      title: 'Google Maps & Business Profile Optimization',
      description:
        'Rank higher in "near me" searches with verified Google Business Profiles, category optimization, review workflows, and regular local updates.',
      outcome: 'More direction requests, calls & map views',
      iconName: 'MapPin',
    },
    {
      id: 'multi-platform-presence',
      number: '06',
      title: 'Multi-platform Presence',
      description:
        'Complete setup, menu/inventory alignment, and visibility management across Zomato, Swiggy, Booking.com, MakeMyTrip, JustDial, Facebook, and key directories.',
      outcome: 'Consistent listings everywhere customers search',
      iconName: 'Layers',
    },
    {
      id: 'ai-automation',
      number: '07',
      title: 'AI and Automation',
      description:
        'Custom chatbots, WhatsApp order and inquiry automation, automated lead capture, and live analytics dashboards built in-house by our AI/ML engineers.',
      outcome: '24/7 instant replies · Zero missed leads',
      iconName: 'Bot',
    },
  ] as ServiceItem[],
  industries: [
    {
      id: 'hotels',
      name: 'Hotels & Resorts',
      outcome: 'Direct room booking engine alongside MakeMyTrip & Booking.com',
      example:
        'Reduce OTA commissions by turning Google Maps and search visitors into direct room reservations.',
      iconName: 'Building2',
    },
    {
      id: 'restaurants',
      name: 'Restaurants & Cloud Kitchens',
      outcome: 'We put your restaurant on every screen your customers look at.',
      example:
        'Direct QR table & online ordering plus optimized Zomato, Swiggy, and Google Maps listings.',
      iconName: 'UtensilsCrossed',
    },
    {
      id: 'cafes',
      name: 'Cafes & Bakeries',
      outcome: 'Local Instagram momentum and repeat WhatsApp pre-orders',
      example:
        'Menu showcases, local "cafes near me" ranking, and automated festive or cake pre-order flows.',
      iconName: 'Coffee',
    },
    {
      id: 'retail',
      name: 'Retail Shops & Showrooms',
      outcome: 'Digital product catalogues that bring store walk-ins and online orders',
      example:
        'Turn an offline showroom inventory into a fast WhatsApp-integrated storefront and local search leader.',
      iconName: 'Store',
    },
    {
      id: 'clinics',
      name: 'Clinics & Healthcare',
      outcome: 'Friction-free appointment booking and trusted patient reviews',
      example:
        'Rank for specialist searches in your city and automate appointment reminders on WhatsApp.',
      iconName: 'Stethoscope',
    },
    {
      id: 'startups',
      name: 'Startups & Local Services',
      outcome: 'Production MVPs, lead pipelines, and search-ready brand launches',
      example:
        'Ship a credible web product, capture qualified leads, and automate onboarding from day one.',
      iconName: 'Rocket',
    },
  ] as IndustryItem[],
  process: [
    {
      number: '01',
      title: 'Audit',
      summary:
        'We inspect your current website, Google Maps presence, directory listings, competitor rankings, and offline sales bottlenecks.',
      deliverable: 'Clear gap report & quick-win checklist',
    },
    {
      number: '02',
      title: 'Strategy',
      summary:
        'We map out the right mix of website architecture, ordering or booking product, SEO keywords, local profiles, and automation.',
      deliverable: 'Fixed-scope roadmap, timeline & pricing',
    },
    {
      number: '03',
      title: 'Build and Launch',
      summary:
        'Our engineers and marketers build your site, online product, directory integrations, and WhatsApp/AI workflows with full testing.',
      deliverable: 'Live production launch & tracking setup',
    },
    {
      number: '04',
      title: 'Grow and Report',
      summary:
        'We run ongoing SEO, social campaigns, review growth, and conversion tuning—sharing plain-English monthly progress reports.',
      deliverable: 'Live dashboard & monthly growth review',
    },
  ] as ProcessStep[],
  /**
   * PLACEHOLDER BENCHMARKS:
   * Replace these sample target metrics with verified client averages once live case studies are published.
   */
  results: {
    placeholderNotice:
      'Sample placeholder benchmarks below — update with verified client outcomes in src/config/site.ts.',
    stats: [
      {
        id: 'orders',
        value: 340,
        prefix: '+',
        suffix: '%',
        label: 'Direct Online Orders (Placeholder)',
        context: 'Target 6-month lift after launching commission-free ordering',
        isPlaceholder: true,
      },
      {
        id: 'visibility',
        value: 4.5,
        suffix: 'x',
        label: 'Google Maps Visibility (Placeholder)',
        context: 'Illustrative local discovery growth in "near me" searches',
        isPlaceholder: true,
      },
      {
        id: 'ranking',
        value: 1,
        prefix: 'Top ',
        suffix: '–3',
        label: 'Local Pack Target Position (Placeholder)',
        context: 'Primary goal for city-level Google Business Profile keywords',
        isPlaceholder: true,
      },
      {
        id: 'traffic',
        value: 185,
        prefix: '+',
        suffix: '%',
        label: 'Organic Search Traffic (Placeholder)',
        context: 'Illustrative 4-month trajectory from technical & local SEO',
        isPlaceholder: true,
      },
    ] as ResultStat[],
  },
  whyNovesta: [
    {
      title: 'Engineering-Led Execution',
      description:
        'We do not rely on bloated drag-and-drop templates. Software engineers build fast, secure, search-friendly websites and real online products.',
      metricNote: 'Built for speed & conversion',
      iconName: 'Code2',
    },
    {
      title: 'AI-Powered Workflows',
      description:
        'Our AI/ML background lets us automate lead qualification, WhatsApp replies, and reporting dashboards that save your team hours every day.',
      metricNote: 'Practical automation, zero hype',
      iconName: 'Sparkles',
    },
    {
      title: 'Transparent Reporting',
      description:
        'You see real calls, orders, bookings, and search rankings—never vanity impressions or confusing marketing jargon.',
      metricNote: 'Plain-English metrics',
      iconName: 'BarChart3',
    },
    {
      title: 'Local Roots, Global Standards',
      description:
        'Based in Jalgaon, Maharashtra and serving businesses across India and globally with modern web engineering and performance marketing.',
      metricNote: 'Jalgaon · India · Worldwide',
      iconName: 'Globe2',
    },
  ] as WhyNovestaPillar[],
  reach: {
    home: 'jalgaon',
    /**
     * PLACEHOLDER CITY TARGETS:
     * Optional `clients` and `comingSoon` counters are omitted until verified numbers exist.
     * CityPanel renders conditional KPI counters only when real numbers are added here.
     */
    cities: [
      {
        id: 'jalgaon',
        city: 'Jalgaon',
        country: 'India',
        lat: 21.0077,
        lng: 75.5626,
        summary: 'Home engineering studio powering Maharashtra businesses online.',
      },
      {
        id: 'mumbai',
        city: 'Mumbai',
        country: 'India',
        lat: 19.076,
        lng: 72.8777,
        summary: 'High-speed web apps and hospitality booking platforms.',
      },
      {
        id: 'pune',
        city: 'Pune',
        country: 'India',
        lat: 18.5204,
        lng: 73.8567,
        summary: 'SEO architectures and AI customer workflows for startups.',
      },
      {
        id: 'bengaluru',
        city: 'Bengaluru',
        country: 'India',
        lat: 12.9716,
        lng: 77.5946,
        summary: 'Scalable SaaS storefronts and automated WhatsApp pipelines.',
      },
      {
        id: 'delhi-ncr',
        city: 'Delhi NCR',
        country: 'India',
        lat: 28.6139,
        lng: 77.209,
        summary: 'Multi-location Google Maps ranking and retail catalogues.',
      },
      {
        id: 'dubai',
        city: 'Dubai',
        country: 'UAE',
        lat: 25.2048,
        lng: 55.2708,
        summary: 'Multilingual hospitality web products and paid social reach.',
      },
      {
        id: 'riyadh',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        lat: 24.7136,
        lng: 46.6753,
        summary: 'Direct booking engines and automated Arabic/English support bots.',
      },
      {
        id: 'singapore',
        city: 'Singapore',
        country: 'Singapore',
        lat: 1.3521,
        lng: 103.8198,
        summary: 'Performance storefronts and technical search optimization.',
      },
      {
        id: 'london',
        city: 'London',
        country: 'UK',
        lat: 51.5072,
        lng: -0.1276,
        summary: 'Local search dominance and commission-free restaurant ordering.',
      },
      {
        id: 'new-york',
        city: 'New York',
        country: 'USA',
        lat: 40.7128,
        lng: -74.006,
        summary: 'Fast web engineering and AI-assisted lead qualification.',
      },
      {
        id: 'sydney',
        city: 'Sydney',
        country: 'Australia',
        lat: -33.8688,
        lng: 151.2093,
        summary: 'Mobile-first clinic booking sites and Maps visibility.',
      },
    ],
  } as ReachConfig,
  founder: {
    name: 'Pawan Rajput',
    role: 'Founder & CEO',
    email: 'novesta111@gmail.com',
    emailHref: 'mailto:novesta111@gmail.com',
    whatsappUrl: 'https://wa.me/919765574216',
    teamLine:
      'Leading a focused in-house team of web engineers, AI automation builders, and search strategists.',
    bio: 'Pawan founded Novesta to bridge the gap between strong offline businesses and modern digital engineering.',
    teamStrip: [
      {
        role: 'Full-Stack & Web Engineers',
        focus: 'React storefronts, booking engines, and technical SEO',
      },
      {
        role: 'AI & Automation Specialists',
        focus: 'WhatsApp bots, lead capture pipelines, and analytics dashboards',
      },
      {
        role: 'Search & Local Growth Strategists',
        focus: 'Google Business Profile, Zomato/Swiggy alignment, and social ads',
      },
    ],
  },
  careers: {
    eyebrow: 'CAREERS AT NOVESTA',
    headlineLine1: 'Build real systems.',
    headlineLine2: 'Ship measurable growth.',
    subheadline:
      'We build fast websites, commission-free ordering and booking platforms, local SEO engines, and AI WhatsApp automation for businesses across India and worldwide.',
    thriveItems: [
      'You have shipped real code, designs, or growth campaigns—not just theory.',
      'You take ownership end-to-end and fix bottlenecks without waiting to be asked.',
      'Feedback makes your work sharper, faster, and more reliable.',
      'You care about measurable business outcomes: calls, orders, and rankings.',
    ],
    dontApplyItems: [
      'You prefer slow approvals over shipping working improvements daily.',
      '"Good enough" template work feels acceptable to you.',
      'You want a title without owning execution and results.',
      'You avoid direct accountability with clients and users.',
    ],
    roles: [
      {
        id: 'fullstack-engineer',
        code: '01',
        title: 'Full-Stack Web Engineer',
        team: 'Engineering',
        location: 'Jalgaon / Remote',
      },
      {
        id: 'seo-maps-specialist',
        code: '02',
        title: 'SEO & Google Maps Specialist',
        team: 'Search & Local Growth',
        location: 'Jalgaon / Remote',
      },
      {
        id: 'ai-automation-builder',
        code: '03',
        title: 'AI & WhatsApp Automation Builder',
        team: 'Automation',
        location: 'Jalgaon / Remote',
      },
    ] as CareerRole[],
    questions: [
      {
        id: 'q1',
        number: '01',
        label:
          'Share a link or summary of a website, product, SEO campaign, or automation you built—what made it work?',
      },
      {
        id: 'q2',
        number: '02',
        label:
          'What hard problem have you solved in your work or life completely from scratch, and what was the outcome?',
      },
      {
        id: 'q3',
        number: '03',
        label:
          'A local business gets website visits but zero WhatsApp inquiries or orders. What three fixes would you ship first?',
      },
    ],
    confirmLabel: 'I read the expectations above and want to build at Novesta.',
  },
  /**
   * PLACEHOLDER TESTIMONIALS:
   * Clearly marked placeholder quotes until verified client testimonials are added.
   */
  testimonials: [
    {
      id: 't1',
      quote:
        'Sample placeholder quote: Moving our restaurant to direct online ordering and optimizing Google Maps doubled our weekend table inquiries without extra aggregator fees.',
      author: 'Client Name Placeholder',
      role: 'Owner',
      business: 'Hospitality & Dining Partner (Sample)',
      industry: 'Restaurants',
      isPlaceholder: true,
    },
    {
      id: 't2',
      quote:
        'Sample placeholder quote: Novesta rebuilt our hotel website with a fast room booking flow and aligned our MakeMyTrip and Google Business listings within three weeks.',
      author: 'Client Name Placeholder',
      role: 'Managing Director',
      business: 'Boutique Hotel Partner (Sample)',
      industry: 'Hotels',
      isPlaceholder: true,
    },
    {
      id: 't3',
      quote:
        'Sample placeholder quote: Having WhatsApp automation connected directly to our clinic website meant every patient inquiry got an instant booking response.',
      author: 'Client Name Placeholder',
      role: 'Lead Practitioner',
      business: 'Healthcare Clinic Partner (Sample)',
      industry: 'Clinics',
      isPlaceholder: true,
    },
  ] as TestimonialItem[],
  faqs: [
    {
      id: 'pricing',
      question: 'How is Novesta pricing structured?',
      answer:
        'We keep pricing straightforward: fixed-scope project quotes for websites, online ordering systems, and booking products, plus transparent monthly retainers for ongoing SEO, Google Maps optimization, social media, and automation. Every proposal lists exact deliverables upfront.',
    },
    {
      id: 'timelines',
      question: 'How long does it take to launch a website or online product?',
      answer:
        'A focused business website typically goes live in 2 to 3 weeks. Custom online ordering systems, hotel booking engines, or multi-platform integrations with AI WhatsApp automation usually launch within 3 to 6 weeks.',
    },
    {
      id: 'seo-results',
      question: 'How quickly will we see Google Search and Google Maps results?',
      answer:
        'Google Business Profile and local map optimizations often start driving more calls and direction requests within 3 to 6 weeks. Organic Google website rankings build progressively over 3 to 6 months as search authority compounds.',
    },
    {
      id: 'ownership',
      question: 'Do we own our website code, domain, and Google Business Profile?',
      answer:
        'Yes, 100%. Your domain name, source code, Google Business Profile, social media pages, analytics accounts, and customer lists remain registered in your business name from day one.',
    },
    {
      id: 'platforms',
      question:
        'Can you manage our presence on Zomato, Swiggy, Booking.com, MakeMyTrip, and JustDial?',
      answer:
        'Yes. We set up, verify, and optimize your profiles across food delivery, travel, and local directory platforms while also building your direct website channel so you rely less on high commissions.',
    },
    {
      id: 'ai-automation',
      question: 'What does AI and automation include for a small or medium business?',
      answer:
        'Practical tools that pay for themselves: 24/7 WhatsApp auto-replies, website lead-capture chatbots, instant booking or menu responses, review request follow-ups, and clean live dashboards showing leads and sales.',
    },
  ] as FaqItem[],
  businessTypeOptions: [
    'Hotel / Resort',
    'Restaurant / Cloud Kitchen',
    'Cafe / Bakery',
    'Retail Shop / Showroom',
    'Clinic / Healthcare',
    'Startup / Tech Product',
    'Local Service Business',
    'Other',
  ],
  planSelectOptions: [
    'Large Business · All Services (₹30,000)',
    'Medium Business · All Services & CRM (₹17,000)',
    'Small Business · Services & Support (₹7,000)',
    'Medium Business · Website Only (₹10,000)',
    'Small Business · Website Only (₹5,000)',
    'Not sure yet',
  ],
};

export function formatCurrencyValue(
  amount: number,
  locale = siteConfig.pricing.locale,
  currency = siteConfig.pricing.currency
): string {
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency}${formatted}`;
}

export function buildPlanWhatsappUrl(plan: PricingPlan): string {
  const formattedPrice = formatCurrencyValue(plan.price);
  const billingSuffix = plan.billing === 'per year' ? '/year' : ` ${plan.billing}`;
  const text = `Hi Novesta, I'm interested in the ${plan.name} plan (${formattedPrice}${billingSuffix}).`;
  return `${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(text)}`;
}
