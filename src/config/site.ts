export interface CareerRole {
  id: string;
  code: string;
  title: string;
  team: string;
  location: string;
}

export const siteConfig = {
  brand: {
    name: 'PDFIndia',
    tagline: '100% private, browser-based document prep for Indian exams and portals',
    parentLine: 'A Novesta product',
    iconPath: '/assets/novesta-mark.webp',
    iconAlt: 'PDFIndia document monogram',
    ogImagePath: '/assets/og-pdfindia.jpg',
    copyrightYear: 2026,
  },
  // Defaults point to novesta.online / hello@novesta.online.
  // Switch to pdfindia.in / support@pdfindia.in only after that domain and mailbox are live.
  domain: 'novesta.online',
  supportEmail: 'hello@novesta.online',
  seo: {
    title: 'PDFIndia — Free Exam Photo, Signature & PDF Tools for India',
    description:
      '100% private, browser-based document prep for Indian exams and portals. Resize UPSC, SSC & IBPS photos, make 35x45mm passport sheets, and compress, merge, or split PDFs locally.',
    canonicalBaseUrl: 'https://novesta.online',
    ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || '',
    googleSiteVerification: import.meta.env.VITE_GSC_VERIFICATION || '',
  },
  contact: {
    phoneDisplay: '+91 8010927311',
    phoneHref: 'tel:+918010927311',
    whatsappNumber: '918010927311',
    whatsappUrl: 'https://wa.me/918010927311',
    email: 'hello@novesta.online',
    emailHref: 'mailto:hello@novesta.online',
    address: {
      city: 'Jalgaon',
      state: 'Maharashtra',
      postalCode: '424201',
      country: 'India',
      full: 'Jalgaon, Maharashtra – 424201',
    },
  },
  socials: [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/novesta111?knvt=MWtpdm85eW5lem9iOQ==',
      handle: '@novesta111',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/share/1A3YFYMYCE/',
      handle: 'Novesta',
    },
    {
      name: 'X',
      url: 'https://x.com/PawanRajput2005',
      handle: '@PawanRajput2005',
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/144155173/',
      handle: 'Novesta',
    },
  ],
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
};
