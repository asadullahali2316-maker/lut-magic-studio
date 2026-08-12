import about from "@/assets/about.webp.asset.json";
import team1 from "@/assets/team1.webp.asset.json";
import team2 from "@/assets/team2.webp.asset.json";
import offer from "@/assets/offer.webp.asset.json";
import partners from "@/assets/partners.webp.asset.json";
import showreel from "@/assets/showreel.png.asset.json";
import cases from "@/assets/cases.png.asset.json";

export const CDN = "https://assets.lutstudios.com/videos/";

/** Directed transition graph: "from-to" -> connecting clip filename. */
export const TRANSITIONS: Record<string, string> = {
  "0-1": "Homepage_showreel.mp4",
  "1-0": "Homepage_showreel_reverse.mp4",
  "0-2": "Homepage_aboutstart.mp4",
  "2-0": "Homepage_aboutstart_reverse.mp4",
  "0-8": "Homepage_cases.mp4",
  "8-0": "Homepage_cases_reverse.mp4",
  "0-9": "Homepage_contact.mp4",
  "9-0": "Homepage_contact_reverse.mp4",
  "2-3": "aboutstarttoabout.mp4",
  "3-2": "aboutstarttoabout_reverse.mp4",
  "3-4": "abouttoteam.mp4",
  "4-3": "abouttoteam_reverse.mp4",
  "4-5": "teamtoteam.mp4",
  "5-4": "teamtoteam_reverse.mp4",
  "5-6": "teamtooffer.mp4",
  "6-5": "teamtooffer_reverse.mp4",
  "6-7": "offertopartner.mp4",
  "7-6": "offertopartner_reverse.mp4",
  "7-8": "partnertoCases.mp4",
  "8-7": "partnertoCases_reverse.mp4",
  "8-9": "CasestoContact.mp4",
  "9-8": "CasestoContact_reverse.mp4",
};

export const LOADER_CLIP = CDN + "loading_to_homepage.mp4";

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
  {
    label: "Showreel",
    kind: "image",
    src: showreel.url,
    contain: true,
    eyebrow: "01 — Reel",
    title: "SHOWREEL",
    body: "A cut of frames, motion and light from recent work.",
  },
  {
    label: "Manifesto",
    kind: "video",
    src: CDN + "aboutstart_loop.mp4",
    eyebrow: "02 — Manifesto",
    title: "EVERY FRAME IS A PAINTING",
    body: "Every project is treated like a canvas — each frame crafted with care and precision.",
  },
  {
    label: "About",
    kind: "image",
    src: about.url,
    eyebrow: "03 — Studio",
    title: "ABOUT",
    body: "A multidisciplinary creative production studio merging high art with high tech.",
  },
  {
    label: "Team",
    kind: "image",
    src: team1.url,
    eyebrow: "04 — People",
    title: "THE TEAM",
    body: "Directors, artists and engineers building images frame by frame.",
  },
  {
    label: "Team II",
    kind: "image",
    src: team2.url,
    eyebrow: "05 — People",
    title: "CRAFT",
    body: "VFX, CGI, animation, commercial production and sound design.",
  },
  {
    label: "Offer",
    kind: "image",
    src: offer.url,
    eyebrow: "06 — Services",
    title: "WHAT WE OFFER",
    body: "From concept and previs to final grade and mix.",
  },
  {
    label: "Partners",
    kind: "image",
    src: partners.url,
    eyebrow: "07 — Partners",
    title: "PARTNERS",
    body: "Brands and studios we build worlds with.",
  },
  {
    label: "Cases",
    kind: "image",
    src: cases.url,
    eyebrow: "08 — Work",
    title: "CASES",
    body: "Selected projects across film, commercial and digital.",
  },
  { label: "Contact", kind: "video", src: CDN + "Contact_loop.mp4" },
];
