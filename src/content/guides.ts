export type ToolId =
  | 'exam-resizer'
  | 'passport-maker'
  | 'compress-pdf'
  | 'merge-pdf'
  | 'split-pdf';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ToolRouteConfig {
  path: string;
  navLabel: string;
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  toolId: ToolId;
  defaultPresetId?: string;
  guideTitle: string;
  sections: GuideSection[];
}

export const TOOL_ROUTES: ToolRouteConfig[] = [
  {
    path: '/upsc-photo-signature-resizer',
    navLabel: 'UPSC Resizer',
    title: 'UPSC Photo & Signature Resizer (20KB–300KB, 350–1000 px) — PDFIndia',
    description:
      'Resize and compress UPSC CSE, NDA, CDS, and CAPF photographs and signatures to 350×350–1000×1000 px and 20KB–300KB JPG locally in your browser with zero uploads.',
    h1: 'UPSC Photo & Signature Resizer',
    subtitle:
      'Format UPSC Civil Services, NDA, CDS, and OTR photographs and signatures to exact pixel dimensions, 300 DPI metadata, and 20 KB – 300 KB JPG size—100% locally in your browser.',
    toolId: 'exam-resizer',
    defaultPresetId: 'upsc-photo',
    guideTitle: 'Complete Guide to UPSC Photo & Signature Specifications',
    sections: [
      {
        heading: 'Exact UPSC Photograph & Signature Requirements',
        paragraphs: [
          'The Union Public Service Commission (UPSC) enforces strict automated validation on its One-Time Registration (OTR) and examination portals. Both your passport-size colour photograph and scanned signature must be saved in JPG/JPEG format with pixel dimensions between 350×350 pixels and 1000×1000 pixels, and a file size strictly between 20 KB and 300 KB. Submitting a PNG renamed to JPG, an image under 20 KB, or a file exceeding 300 KB immediately triggers a portal upload error.',
          'PDFIndia defaults to 500×500 px for UPSC photographs and 500×200 px for horizontal signatures while embedding standard 300 DPI JFIF headers. If a specific UPSC recruitment notification strictly demands a square 350×350 px minimum height for signatures as well, switch to the Custom preset and enter 500×500 px or 350×350 px with the same 20–300 KB range. Always cross-verify the latest UPSC notification PDF for your exam cycle before final submission.',
        ],
      },
      {
        heading: 'How to Prepare Your UPSC Photo Without Portal Rejection',
        paragraphs: [
          'Capture your photograph in even natural daylight against a plain white or light off-white wall so there are no harsh shadows behind your head or shoulders. Your face should occupy roughly three-quarters of the frame with both ears clearly visible, eyes open, and a neutral expression without sunglasses or tinted lenses. If the current UPSC notification requires your candidate name and date of photograph printed at the bottom, generate the photograph first in our Passport Photo Maker with the Name & Date strip enabled, then verify the file size here.',
          'When preparing your signature, write with a dark black ballpoint or gel pen on plain, unruled white A4 paper. Avoid photographing the page under dim yellow tubelights or at an angle. Crop tightly around your signature in PDFIndia and enable the Signature Cleanup controls (grayscale, contrast boost, and paper background whitening) so the output looks like a crisp flatbed scan with dark strokes on pure white paper.',
        ],
        bullets: [
          'Never write your signature in ALL CAPITAL LETTERS—UPSC scrutiny flags block-letter signatures as invalid.',
          'Keep your face centered inside the dashed oval guide before clicking Resize & Verify.',
          'Verify the green confirmation banner showing exact output KB (to 2 decimals) and pixel dimensions before uploading to upsconline.nic.in.',
          'Keep a high-resolution original backup on your phone or computer in case you need to adjust framing later.',
        ],
      },
      {
        heading: 'Why Local Browser Processing Protects UPSC Candidates',
        paragraphs: [
          'During OTR and DAF registration, candidates handle sensitive personal photographs, handwritten signatures, photo ID scans, and academic certificates. Traditional free image compressors upload your files to remote third-party servers, where retention policies and logging practices are often opaque. PDFIndia runs its 15-step JPEG binary-search compressor and JFIF DPI writer entirely inside a local browser Web Worker using Canvas and OffscreenCanvas.',
          'Your photograph and signature bytes never touch any network request, API endpoint, analytics script, or cloud storage bucket. Once you download the verified JPG, clicking Clear all files immediately releases browser memory and revokes every temporary object URL.',
        ],
      },
    ],
  },
  {
    path: '/ssc-photo-resizer',
    navLabel: 'SSC Resizer',
    title: 'SSC Photo & Signature Resizer (20KB–50KB & 10KB–20KB) — PDFIndia',
    description:
      'Resize SSC CGL, CHSL, GD, MTS, and JE photos to 3.5×4.5 cm (20KB–50KB) and signatures to 4.0×2.0 cm (10KB–20KB) locally in your browser without uploading files.',
    h1: 'SSC Photo & Signature Resizer',
    subtitle:
      'Hit exact SSC (CGL, CHSL, GD, MTS) size windows—20 KB to 50 KB for 3.5×4.5 cm photographs and 10 KB to 20 KB for 4.0×2.0 cm signatures—in one click.',
    toolId: 'exam-resizer',
    defaultPresetId: 'ssc-photo',
    guideTitle: 'How to Meet SSC CGL, CHSL & GD Photo and Signature Rules',
    sections: [
      {
        heading: 'Understanding SSC Dimensions and Tight KB Limits',
        paragraphs: [
          'Staff Selection Commission (SSC) portals for CGL, CHSL, GD Constable, MTS, CPO, and Junior Engineer examinations have some of the narrowest file-size bands among Indian recruitment boards. Photographs must measure 3.5 cm wide by 4.5 cm high (413×531 pixels at 300 DPI) and weigh strictly between 20 KB and 50 KB in JPEG format. Signatures must measure 4.0 cm wide by 2.0 cm high (472×236 pixels at 300 DPI) and fall strictly between 10 KB and 20 KB.',
          'Standard phone cameras capture 3 MB to 8 MB photos, and naive resizing often either overshoots 50 KB or crushes the image down to 8 KB—causing rejection for being below the 20 KB minimum. PDFIndia runs a 15-iteration binary search across JPEG quality levels to find the highest visual clarity that stays strictly inside the permitted KB band. If a clean signature naturally compresses under 10 KB even at 99% JPEG quality, PDFIndia safely appends a standards-compliant JFIF comment segment so the file passes the 10 KB portal floor without altering a single pixel of your handwriting.',
        ],
      },
      {
        heading: 'Avoiding Common SSC Scrutiny Rejections',
        paragraphs: [
          'SSC rejects thousands of applications every cycle for preventable image defects rather than eligibility errors. Always remove caps, hats, dark glasses, and heavy reflections on spectacles. Keep your head straight, facing the camera directly against a bright, uniform background. Note that newer SSC One-Time Registration (OTR) screens may also capture a live webcam photograph during form fill—continue following the latest ssc.gov.in instructions alongside your uploaded signature file.',
          'For signatures, SSC explicitly warns against miniature signatures, vertical/rotated images, and blurred camera shots. Use PDFIndia’s interactive aspect-locked cropper so your signature fills roughly 80% of the 4.0×2.0 cm frame horizontally, then turn on grayscale and background whitening so the white paper does not turn muddy grey when compressed below 20 KB.',
        ],
        bullets: [
          'Check that the photo is right-side up and never upside down or sideways.',
          'Verify exact dimensions: 413×531 px for photos and 472×236 px for signatures at 300 DPI.',
          'Avoid filters, beauty smoothing, or WhatsApp-forwarded copies that introduce heavy JPEG block artifacts.',
          'Double-check the preview side-by-side before downloading to confirm your facial features and ink strokes stay sharp.',
        ],
      },
      {
        heading: 'Zero-Upload Privacy for SSC Applicants',
        paragraphs: [
          'Every step of cropping, signature cleanup, binary-search JPEG compression, and 300 DPI header writing runs offline inside your browser tab. No copy of your photograph or signature is transmitted to Novesta servers or any third-party cloud service. You can even disconnect your mobile data after loading the page and keep resizing files locally.',
        ],
      },
    ],
  },
  {
    path: '/ibps-photo-signature-resizer',
    navLabel: 'IBPS/SBI Resizer',
    title: 'IBPS & SBI Photo & Signature Resizer (200×230 px, 140×60 px) — PDFIndia',
    description:
      'Resize IBPS PO, Clerk, RRB, and SBI photos to 200×230 px (20KB–50KB) and signatures to 140×60 px (10KB–20KB) privately in your browser.',
    h1: 'IBPS & SBI Photo & Signature Resizer',
    subtitle:
      'Prepare bank exam photographs (200×230 px, 20–50 KB) and signatures (140×60 px, 10–20 KB) for IBPS PO, Clerk, SO, RRB, and SBI portals locally.',
    toolId: 'exam-resizer',
    defaultPresetId: 'ibps-photo',
    guideTitle: 'IBPS PO, Clerk, RRB & SBI Upload Specifications Explained',
    sections: [
      {
        heading: 'Why IBPS & SBI Pixel Sizes Need Special Care',
        paragraphs: [
          'Banking examinations conducted by IBPS (PO, Clerk, Specialist Officer, RRB) and State Bank of India (SBI PO, Junior Associate) specify compact pixel dimensions alongside strict minimum file sizes: 200×230 pixels (20 KB – 50 KB) for colour photographs and 140×60 pixels (10 KB – 20 KB) for handwritten signatures. Because 140×60 pixels contains only 8,400 pixels total, most image editors save it at 3 KB to 6 KB—which banking portals reject immediately for falling below the 10 KB minimum.',
          'PDFIndia solves this exact frustration automatically. After resizing your signature cleanly to 140×60 px with high-contrast black ink on pure white paper, our engine maximizes JPEG quality first and then adds harmless, specification-valid JFIF COM metadata bytes only when needed to cross the 10 KB floor while staying strictly under 20 KB. The rendered image remains sharp and opens identically in every browser and IBPS verification viewer.',
        ],
      },
      {
        heading: 'Checklist for Bank Exam Photos, Signatures & Declarations',
        paragraphs: [
          'Banking exam portals also require a left thumb impression (typically 240×240 px, 20–50 KB) and a handwritten declaration (typically 800×400 px, 50–100 KB). You can prepare both in seconds by selecting the Custom Size preset in PDFIndia, typing the exact pixel dimensions and KB range listed in your current IBPS or SBI notification brochure, and using our live contrast and background-whitening sliders to make blue or black ink stand out cleanly.',
          'Never sign in capital letters for IBPS or SBI forms, as official notifications explicitly state that signatures in block letters will not be accepted. Make sure your signature uses black ink on white unruled paper and is cropped closely without extra blank margins.',
        ],
        bullets: [
          'IBPS/SBI Photo: 200×230 px, 20 KB – 50 KB, colour JPG, plain light background.',
          'IBPS/SBI Signature: 140×60 px, 10 KB – 20 KB, black ink on white paper, running hand (no ALL CAPS).',
          'Left Thumb & Handwritten Declaration: Switch to Custom Size and enter the dimensions from your active recruitment PDF.',
          'Always inspect the final preview at 100% zoom so there is no blur or clipping on the first or last letter.',
        ],
      },
      {
        heading: '100% Browser-Local Privacy for Banking Aspirants',
        paragraphs: [
          'Thumb impressions, signatures, and identification photos are sensitive biometric and personal records. PDFIndia processes every pixel inside your own browser memory with zero server uploads, zero file logging, and zero browser storage persistence. Close the tab or tap Clear all files when finished and nothing remains behind.',
        ],
      },
    ],
  },
  {
    path: '/passport-photo-maker',
    navLabel: 'Passport Maker',
    title: 'Indian Passport Photo Maker (35×45 mm) & 8-Copy Print Sheet — PDFIndia',
    description:
      'Create 35×45 mm (413×531 px, 300 DPI) Indian passport & exam photos with optional Name & Date strip plus 8-copy A4 or 6×4 printable sheets locally.',
    h1: 'Indian Passport Photo Maker (35×45 mm)',
    subtitle:
      'Crop to exact 35×45 mm (413×531 px at 300 DPI), add an optional Name & Date of Photo strip, and export both a single digital JPG and an 8-copy A4 or 6×4 printable sheet with cut guides.',
    toolId: 'passport-maker',
    guideTitle: 'Printing & Uploading Indian 35×45 mm Passport Photos',
    sections: [
      {
        heading: 'Standard 35×45 mm Dimensions at 300 DPI',
        paragraphs: [
          'The standard passport photograph size across India—used for Indian Passports (Passport Seva), PAN card applications, driving licence forms, visa stickers, SSC, NEET, and state government recruitment—is 35 mm wide by 45 mm tall. At professional lab print resolution (300 dots per inch), 35×45 mm equals exactly 413×531 pixels. Printing an image that lacks a 300 DPI header or uses an incorrect aspect ratio results in stretched faces or photos that get trimmed incorrectly at the studio.',
          'PDFIndia locks the crop frame strictly to the 35:45 ratio, overlays a centered oval head-and-shoulder guide, renders at 413×531 pixels, and stamps 300 DPI directly into the JPEG JFIF header. You receive two ready-to-use files in one click: a single 35×45 mm JPG for online portals and a print-ready 8-copy sheet with dashed cutting guides.',
        ],
      },
      {
        heading: 'Choosing Between 6×4 Inch Landscape and A4 Portrait Sheets',
        paragraphs: [
          'Most neighbourhood photo studios, Xerox shops, and instant Kodak/Fuji kiosk printers in India print standard 4×6 inch (6×4 landscape, 152.4×101.6 mm) glossy photo paper for ₹10 to ₹30 per sheet. At 300 DPI, our 6×4 landscape sheet measures exactly 1800×1200 pixels and arranges 8 copies in a 4×2 grid with 1.5 mm cutting gaps and clean outer margins so zero photos are clipped by borderless printers.',
          'If you are printing on a home inkjet or office laser printer loaded with standard A4 photo paper (210×297 mm), switch to A4 Portrait (2480×3508 pixels at 300 DPI). Always select “100% / Actual Size” (not “Fit to Page”) in your printer dialog so each cut photograph measures a true 35×45 mm.',
        ],
        bullets: [
          'Optional Name & Date of Photo strip automatically scales long names so text never clips or overlaps.',
          'Choose Pure White (#FFFFFF), Light Blue (#E0F2FE), or Light Grey (#F1F5F9) fill for transparent cutouts or margins.',
          'Toggle the thin dark border when printing white-background photos on white paper so scissors can follow exact edges.',
          'Need the single photo compressed to 20–50 KB for an exam portal? Download the single JPG and drop it into our Exam Photo Resizer.',
        ],
      },
      {
        heading: 'Honest Privacy & Local Processing Note',
        paragraphs: [
          'PDFIndia intentionally avoids sending your portrait to third-party cloud background-removal APIs. Stand against a plain light-coloured wall in natural light for studio-grade results while keeping 100% of your personal photographs strictly on your own device.',
        ],
      },
    ],
  },
  {
    path: '/compress-pdf',
    navLabel: 'Compress PDF',
    title: 'Compress PDF Under 200KB, 500KB, 1MB or 2MB Online (Local) — PDFIndia',
    description:
      'Reduce PDF size to under 2MB, 1MB, 500KB, or 200KB for UPSC, Passport Seva, SSC, and scholarship portals—100% locally in your browser with zero uploads.',
    h1: 'Compress PDF to Exact Portal Size',
    subtitle:
      'Hit strict Indian portal upload caps—Under 2 MB, 1 MB, 500 KB, or 200 KB—with automatic quality tuning, page-by-page local processing, and a legibility preview.',
    toolId: 'compress-pdf',
    guideTitle: 'How to Reduce PDF Size for Indian Government & Exam Portals',
    sections: [
      {
        heading: 'Why Indian Portals Reject Scanned PDFs',
        paragraphs: [
          'Mobile scanner apps and cyber-cafe flatbed scanners frequently save 2-to-5-page documents (such as 10th/12th marksheets, caste or EWS certificates, degree certificates, and Aadhaar copies) at 300 to 600 DPI, producing 5 MB to 18 MB PDFs. However, Indian portals enforce tight upload ceilings: UPSC DAF and Passport Seva commonly cap documents at 1 MB or 2 MB, while many state scholarship, university admission, and SSC/IBPS document upload screens demand under 500 KB or even 200 KB.',
          'PDFIndia compresses your PDF entirely inside your browser using locally bundled pdf.js and pdf-lib engines. It renders pages cleanly one by one to keep memory usage low, searches for the highest legible JPEG quality that fits below your chosen target, and steps resolution down gently (150 DPI → 125 DPI → 100 DPI) only if needed. Crucially, PDFIndia refuses to drop below 100 DPI so fine print, roll numbers, and verification QR codes remain readable.',
        ],
      },
      {
        heading: 'Important Note About Rasterized PDFs & Keeping Your Original',
        paragraphs: [
          'To guarantee predictable compression under strict targets like 200 KB or 500 KB, page-by-page compression converts each PDF page into an optimized image embedded inside a new PDF. As a result, text inside the compressed copy will no longer be selectable or searchable—though it prints and displays identically for document verification officers.',
          'Always keep your original high-resolution PDF safely stored on your device. If a 20-page book or dense scanned bundle still cannot fit under 200 KB at 100 DPI, PDFIndia tells you honestly instead of producing an unreadable blur. In that case, use our Split PDF tool first to keep only the required pages, then compress again.',
        ],
        bullets: [
          'Under 2 MB: Ideal for UPSC DAF, Passport Seva, and multi-page income/domicile bundles.',
          'Under 1 MB: Ideal for State PSC, DigiLocker supplementary uploads, and college admissions.',
          'Under 500 KB: Ideal for SSC, IBPS, and single-to-three page certificates.',
          'Under 200 KB: Best suited for 1–2 page marksheets, admit cards, or ID proofs.',
          'Password-protected PDFs (such as e-Aadhaar) cannot be processed while locked—unlock the PDF first before compressing.',
        ],
      },
      {
        heading: 'Private Enough for Aadhaar, PAN & Marksheets',
        paragraphs: [
          'Your certificates contain date of birth, parent names, Aadhaar numbers, and permanent addresses. Because PDFIndia executes 100% locally in your browser without uploading a single byte to any server, your documents never leave your laptop or smartphone.',
        ],
      },
    ],
  },
  {
    path: '/merge-pdf',
    navLabel: 'Merge PDF',
    title: 'Merge PDF & Images to A4 PDF Online (Optional 2MB Cap) — PDFIndia',
    description:
      'Combine multiple PDFs, JPGs, and PNGs into one A4 PDF with drag reorder, 90° rotation, and an optional 2MB portal cap—100% locally in your browser.',
    h1: 'Merge PDFs & Images into One PDF',
    subtitle:
      'Combine marksheets, front/back ID photos, and PDF certificates in the exact order required. Images auto-fit onto standard A4 pages with clean margins, plus an optional 2 MB size cap.',
    toolId: 'merge-pdf',
    guideTitle: 'Combining Marksheets, Certificates & Photos for Online Forms',
    sections: [
      {
        heading: 'One Clean A4 Document From Mixed PDFs and Phone Photos',
        paragraphs: [
          'Many government and university application forms give you only a single upload slot for “Educational Qualification Proof” or “Address & Identity Proof”, even when you have a PDF for your 10th board marksheet and two separate JPG photos for your 12th marksheet and provisional degree. Mixing mismatched page sizes—such as giant 4000-pixel phone camera images alongside standard A4 PDFs—creates awkward documents that scroll poorly for verifiers.',
          'PDFIndia lets you drop PDFs, JPGs, PNGs, and WebP files together in one queue. Every image is automatically centered and scaled onto a uniform A4 page (210×297 mm) with clean 36 pt print margins, while existing PDF pages retain their original vector text and clarity unless you opt into the 2 MB size cap.',
        ],
      },
      {
        heading: 'Reorder, Rotate & Keep Final Output Under 2 MB',
        paragraphs: [
          'Use drag-and-drop handles or the keyboard-accessible Up and Down arrow buttons to put your certificates in chronological order (for example: 10th marksheet, 12th marksheet, Graduation degree). If a scanned page or camera photo was captured sideways, tap the Rotate 90° button on that file before merging.',
          'Need the combined PDF to stay under a 2 MB portal upload limit? Simply tick “Keep final PDF under 2 MB” before clicking Merge. If the combined PDF is already under 2 MB, PDFIndia keeps it untouched and lossless; if it exceeds 2 MB, our local compression engine automatically optimizes it to fit below 2 MB while preserving readability.',
        ],
        bullets: [
          'Supports combining any mix of PDF, JPG, PNG, and WebP files in one pass.',
          'Transparent PNG scans automatically flatten onto a pure white background.',
          'Cancel button halts large merges immediately if you need to change page order.',
          'Password-protected PDFs will prompt “Unlock this file first.” so you never get a silent failure.',
        ],
      },
      {
        heading: 'Built for Document Privacy',
        paragraphs: [
          'All page copying, A4 image embedding, rotation, and optional size-cap compression run inside your browser tab via dynamically loaded pdf-lib. Your marksheets and identity proofs are never transmitted over the internet.',
        ],
      },
    ],
  },
  {
    path: '/split-pdf',
    navLabel: 'Split PDF',
    title: 'Split PDF & Extract Pages Locally (1, 3-5 Ranges) — PDFIndia',
    description:
      'Extract exact pages or ranges from any PDF with visual thumbnails and lossless text quality—100% locally in your browser with zero uploads.',
    h1: 'Split PDF & Extract Specific Pages',
    subtitle:
      'Preview every page visually, click thumbnails or type exact ranges like 1, 3-5, and download a clean new PDF without re-compressing text or images.',
    toolId: 'split-pdf',
    guideTitle: 'Extracting Exact Pages From Admit Cards, Gazette Lists & PDFs',
    sections: [
      {
        heading: 'Lossless Page Extraction Without Quality Loss',
        paragraphs: [
          'Exam admit cards often bundle 4 to 6 pages of general instructions behind the single page you actually need to print or upload. Similarly, merit lists, university syllabi, bank statements, and combined scan PDFs often contain dozens of pages when a portal asks for only two specific pages. Extracting those pages should never degrade text sharpness or inflate file size.',
          'PDFIndia’s Split PDF tool copies the exact original PDF page objects directly into a new document using pdf-lib. Fonts remain selectable, barcodes and QR codes stay vector-sharp, and extraction finishes in milliseconds—all strictly inside your browser.',
        ],
      },
      {
        heading: 'Visual Thumbnail Grid + Fast Range Syntax',
        paragraphs: [
          'As soon as you load a PDF, PDFIndia renders crisp local thumbnails one page at a time so you can verify exactly which pages you want before downloading. You can click individual page thumbnails to toggle them on or off, or type ranges directly into the range box using standard syntax such as “1”, “2-4”, or “1, 3-5, 8”.',
          'Both controls stay synchronized in real time. If you accidentally type a page number beyond the document length, reverse a range like “5-2”, or enter invalid punctuation, PDFIndia highlights the exact mistake immediately so you never download the wrong pages.',
        ],
        bullets: [
          'Use “1” to isolate just Page 1 of a multi-page UPSC, SSC, or NTA admit card.',
          'Use ranges like “2-3, 7” to extract specific semester marksheets from a combined transcript.',
          'Use Split PDF before Compress PDF when a large multi-page scan exceeds a 200 KB or 500 KB upload limit.',
          'If a PDF is password-protected, unlock it first—PDFIndia never attempts to bypass document encryption.',
        ],
      },
      {
        heading: 'Zero Server Uploads, Zero Data Retention',
        paragraphs: [
          'Whether you are splitting an admit card, bank statement, or confidential legal notice, every thumbnail and extracted PDF is generated strictly in local browser memory. Clicking Clear all files revokes every preview object URL immediately.',
        ],
      },
    ],
  },
];

export function getToolRouteByPath(pathname: string): ToolRouteConfig | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return TOOL_ROUTES.find((r) => r.path === normalized);
}

export const HOME_GUIDE_DATA: {
  introTitle: string;
  introParagraphs: string[];
  rejectionTitle: string;
  rejectionSteps: Array<{ title: string; detail: string }>;
  faqs: FaqItem[];
} = {
  introTitle: 'Complete Document Prep Guide for Indian Competitive Exams & Portals',
  introParagraphs: [
    'Every year, lakhs of candidates applying for UPSC Civil Services, SSC CGL/CHSL/GD, IBPS/SBI banking exams, state PSCs, scholarships, and Passport Seva spend hours wrestling with portal upload rejections. Most Indian government portals validate four properties simultaneously: exact pixel dimensions (or centimetre print size at 300 DPI), strict minimum and maximum KB file size, pure JPG/JPEG encoding (never renamed PNG or WebP), and clean visual framing without heavy shadows or rotated orientation.',
    'PDFIndia brings all five everyday document tools into one fast, privacy-first browser workspace—Exam Photo & Signature Resizer, 35×45 mm Indian Passport Photo Maker (with 8-copy printable sheets), PDF Compressor, PDF Merger, and PDF Splitter. Instead of uploading sensitive photographs, handwritten signatures, Aadhaar copies, or board marksheets to unknown third-party servers, PDFIndia runs every image and PDF engine locally inside your own browser using Web Workers, HTML5 Canvas, pdf-lib, and locally bundled pdf.js.',
  ],
  rejectionTitle: '6 Steps to Avoid Exam Portal Photo, Signature & PDF Rejections',
  rejectionSteps: [
    {
      title: '1. Verify the active official notification first',
      detail:
        'Exam boards occasionally update rules between cycles—for example, UPSC requiring a recent photo with candidate name and date, or SSC introducing live webcam capture in OTR. Always check the official notification PDF linked beside every preset.',
    },
    {
      title: '2. Lock the aspect ratio before compressing',
      detail:
        'Never stretch a square selfie into a 3.5×4.5 cm rectangle. Use our locked aspect-ratio cropper with the centered oval face guide so your proportions stay natural and both ears remain clearly visible.',
    },
    {
      title: '3. Hit both the minimum and maximum KB bounds',
      detail:
        'Many Indian portals reject files that are too small (for example, an IBPS 140×60 px signature saving at 5 KB when the minimum is 10 KB). PDFIndia automatically finds the highest clear quality inside [min KB, max KB] and pads harmless JFIF metadata only when fixed dimensions fall under the minimum.',
    },
    {
      title: '4. Clean grey paper shadows on signatures',
      detail:
        'Sign with black ink on plain white unruled paper in bright light, then enable Signature Cleanup (grayscale, contrast boost, and paper whitening) so the final signature has sharp ink strokes on pure #FFFFFF white.',
    },
    {
      title: '5. Keep scanned PDFs legible at 100+ DPI',
      detail:
        'Compressing a 10-page PDF to 200 KB will ruin readability. Extract only the required pages with Split PDF first, then compress while keeping text and verification QR codes sharp at 100–150 DPI.',
    },
    {
      title: '6. Clear local memory on shared or cyber-cafe computers',
      detail:
        'PDFIndia never saves files to localStorage or IndexedDB. After downloading your verified files on a shared computer, click “Clear all files” and delete the downloaded copies from the Downloads folder once uploaded.',
    },
  ],
  faqs: [
    {
      question: 'How to reduce photo size to 20KB-50KB without losing clarity?',
      answer:
        'First resize the photo to the exact target pixel dimensions (such as 413×531 px for SSC or 200×230 px for IBPS) instead of compressing a 4000-pixel camera file directly. PDFIndia then runs a 15-iteration binary search over JPEG quality to pick the single highest clarity level that lands strictly between 20.00 KB and 50.00 KB, while writing clean 300 DPI JFIF metadata.',
    },
    {
      question: 'Is it safe to upload Aadhaar or marksheets here?',
      answer:
        'Yes—because your files are never uploaded anywhere. All photo resizing, passport sheet generation, PDF compression, merging, and splitting run 100% locally inside your browser tab. Zero document bytes are sent to our servers, analytics tools, or third-party APIs, and nothing is written to localStorage or IndexedDB.',
    },
    {
      question: 'Why does my signature fall below 10 KB even at high quality, and how does PDFIndia fix it?',
      answer:
        'Small signatures such as IBPS/SBI (140×60 px) contain very few pixels, so standard JPEG encoders often output 4 KB to 7 KB—which portals reject for being below 10 KB. When pixel dimensions are fixed, PDFIndia maximizes visual quality first and then adds a standards-compliant JFIF COM comment segment so the file meets the exact 10 KB minimum without altering the visible image.',
    },
    {
      question: 'Will text stay selectable after I compress a PDF?',
      answer:
        'No. To reliably hit strict limits like 200 KB or 500 KB, PDF compression renders each page as an optimized JPEG image inside a new PDF, so text will not be selectable. Always keep your original PDF file. By contrast, Split PDF and Merge PDF (without the 2 MB compression cap) preserve original selectable text losslessly.',
    },
    {
      question: 'Can PDFIndia process password-protected PDFs like e-Aadhaar?',
      answer:
        'No. For security and privacy reasons, PDFIndia never attempts to crack or bypass document passwords. If you select a locked PDF, you will see “Unlock this file first.” Open the PDF with its password in your browser or PDF viewer, print/save an unlocked copy locally, and then compress, merge, or split it here.',
    },
    {
      question: 'Why are GATE, NEET (UG), and RRB rules marked to verify from official notifications?',
      answer:
        'Exam authorities periodically revise pixel ranges, postcard photo sizes, and signature dimensions across recruitment years. Rather than showing outdated or guessed numbers, PDFIndia marks unverified cycles transparently and provides a Custom Size preset where you can enter the exact px, DPI, and KB range from your current notification brochure.',
    },
  ],
};
