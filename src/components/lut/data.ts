// NOTE: the previous `@/assets/*.asset.json` imports pointed at Lovable's
// internal preview host ("/__l5e/assets-v1/...") which only resolves
// inside their editor — outside it those requests 404, leaving the
// About / Team / Craft / Offer / Partners scenes with nothing but the
// black vignette behind the text. Using the site's real public images
// fixes that.
const SITE = "https://lutstudios.com";
const about = SITE + "/optimized/about--1920.webp";
const team1 = SITE + "/optimized/team1--1920.webp";
const team2 = SITE + "/optimized/team2--1920.webp";
const offer = SITE + "/optimized/offer--1920.webp";
const partners = SITE + "/optimized/partners--1920.webp";
const cases = SITE + "/Cases_png_transparent.png";

export const CDN = "https://assets.lutstudios.com/videos/";

/**
 * Directed transition graph: "from-to" -> connecting clip filename.
 * The Showreel scene has been removed — scrolling from Home now goes
 * straight into the Manifesto ("EVERY FRAME IS A PAINTING") scene via
 * Homepage_aboutstart.mp4, matching the site's own about-start clip.
 */
export const TRANSITIONS: Record<string, string> = {
  "0-1": "Homepage_aboutstart.mp4",
  "1-0": "Homepage_aboutstart_reverse.mp4",
  "0-7": "Homepage_cases.mp4",
  "7-0": "Homepage_cases_reverse.mp4",
  "0-8": "Homepage_contact.mp4",
  "8-0": "Homepage_contact_reverse.mp4",
  "1-2": "aboutstarttoabout.mp4",
  "2-1": "aboutstarttoabout_reverse.mp4",
  "2-3": "abouttoteam.mp4",
  "3-2": "abouttoteam_reverse.mp4",
  "3-4": "teamtoteam.mp4",
  "4-3": "teamtoteam_reverse.mp4",
  "4-5": "teamtooffer.mp4",
  "5-4": "teamtooffer_reverse.mp4",
  "5-6": "offertopartner.mp4",
  "6-5": "offertopartner_reverse.mp4",
  "6-7": "partnertoCases.mp4",
  "7-6": "partnertoCases_reverse.mp4",
  "7-8": "CasestoContact.mp4",
  "8-7": "CasestoContact_reverse.mp4",
};

export const LOADER_CLIP = CDN + "loading_to_homepage.mp4";

/** Cycled every ~500ms on the preloader while the bar fills up. */
export const LOADING_TEXTS = [
  "LOADING",
  "PREPARING FRAMES",
  "GRADING COLOR",
  "BUILDING SCENE",
  "RENDERING LIGHT",
  "ALMOST THERE",
  "ENTERING STUDIO",
  "WELCOME",
];

export type CaseItem = {
  title: string;
  tag: string;
};

/** Case-card captions shown over each scrollable thumbnail in the grid. */
export const CASE_ITEMS: CaseItem[] = [
  { title: "Roadside", tag: "Jakob & Ryan" },
  { title: "Testing [Home]", tag: "Live Performance" },
  { title: "Shell — V-Power", tag: "Commercial" },
  { title: "Nightfall", tag: "Music Video" },
  { title: "Dunes", tag: "Short Film" },
  { title: "Aurora", tag: "Brand Film" },
  { title: "Afterglow", tag: "Commercial" },
  { title: "Static", tag: "Experimental" },
  { title: "Departures", tag: "Documentary" },
  { title: "Halcyon", tag: "Music Video" },
  { title: "Lumen", tag: "Brand Film" },
  { title: "Undertow", tag: "Short Film" },
];

export type Scene = {
  label: string;
  kind: "video" | "image";
  src: string;
  contain?: boolean;
  eyebrow?: string;
  title?: string;
  body?: string;
};

export const SCENES: Scene[] = [
  { label: "Home", kind: "video", src: CDN + "Homepage_loop.mp4" },
  { label: "Manifesto", kind: "video", src: CDN + "aboutstart_loop.mp4" },
  { label: "About", kind: "image", src: about },
  { label: "Team", kind: "image", src: team1 },
  { label: "Team II", kind: "image", src: team2 },
  { label: "Offer", kind: "image", src: offer },
  { label: "Partners", kind: "image", src: partners },
  { label: "Cases", kind: "image", src: cases },
  { label: "Contact", kind: "video", src: CDN + "Contact_loop.mp4" },
];