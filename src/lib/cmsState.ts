import { SpaPackage, Service, FAQ, Branch } from '../types';
import { BRANCHES, SPA_PACKAGES, SERVICES, FAQS } from '../data';

export interface HeroCMS {
  backgroundImage: string;
  tagline: string;
  title: string;
  description: string;
}

export interface AboutCMS {
  tagline: string;
  title: string;
  desc1: string;
  desc2: string;
  established: string;
  branchCount: string;
  openingHours: string;
  hotline: string;
  quoteText: string;
  quoteAuthor: string;
  quoteMeta: string;
}

export interface CMSData {
  hero: HeroCMS;
  about: AboutCMS;
  branches: Branch[];
  /**
   * Bookable spa packages. The storage key stays `accommodations` because the
   * reservation API, the `site_content` row, and the room-inventory reconciler
   * all address it by that name.
   */
  accommodations: SpaPackage[];
  services: Service[];
  faqs: FAQ[];
}

// 1. BLANK SLATE STRUCTURES (Initial state on first run)
export const BLANK_HERO: HeroCMS = {
  backgroundImage: '',
  tagline: '',
  title: '',
  description: '',
};

export const BLANK_ABOUT: AboutCMS = {
  tagline: '',
  title: '',
  desc1: '',
  desc2: '',
  established: '',
  branchCount: '',
  openingHours: '',
  hotline: '',
  quoteText: '',
  quoteAuthor: '',
  quoteMeta: '',
};

/** Branches always carry their ids and names — an unnamed branch cannot be booked. */
export const BLANK_BRANCHES: Branch[] = BRANCHES.map(b => ({ ...b }));

export const BLANK_ACCOMMODATIONS: SpaPackage[] = [
  {
    id: 'signature-suite',
    name: '',
    type: 'signature_suite',
    description: '',
    capacity: 0,
    price: 0,
    features: [],
    imageUrl: '',
    quantity: 0,
  },
  {
    id: 'deluxe-room',
    name: '',
    type: 'deluxe_room',
    description: '',
    capacity: 0,
    price: 0,
    features: [],
    imageUrl: '',
    quantity: 0,
  },
  {
    id: 'classic-room',
    name: '',
    type: 'classic_room',
    description: '',
    capacity: 0,
    price: 0,
    features: [],
    imageUrl: '',
    quantity: 0,
  },
];

export const BLANK_SERVICES: Service[] = [
  { id: 'massage-therapy', name: '', description: '', image: '', price: '', details: [] },
  { id: 'beauty-wellness', name: '', description: '', image: '', price: '', details: [] },
  { id: 'spa-amenities', name: '', description: '', image: '', price: '', details: [] },
];

export const BLANK_FAQS: FAQ[] = [];

// 2. DEFAULT SEED DATA (populates the site with standard Spa de Iloko content)
export const DEFAULT_HERO: HeroCMS = {
  backgroundImage: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1600',
  tagline: 'RELAX · REFRESH · REJUVENATE',
  title: 'Spa de Iloko',
  description: 'Traditional Ilocano hilot and modern bodywork in warm, quiet treatment rooms. Six branches across Northern Luzon, one standard of care — book a room at the branch nearest you.',
};

export const DEFAULT_ABOUT: AboutCMS = {
  tagline: 'OUR STORY',
  title: 'Where Traditional Hilot Meets Modern Comfort',
  desc1: 'Spa de Iloko opened in 2014 with a single treatment room and one idea: that the hilot our grandparents grew up with deserved a room as calm and as clean as any city spa. We trained our therapists in the traditional Ilocano technique first, then in Swedish, shiatsu, and aromatherapy — so that whichever you book, the hands working on you know exactly what they are doing.',
  desc2: 'Today we run six branches across Northern Luzon. Every one of them is built the same way: warm light, quiet floors, fresh linens for every guest, and a herbal foot soak waiting when you arrive. Book any branch and you will walk into the same room you remember.',
  established: 'EST. 2014',
  branchCount: '6 BRANCHES',
  openingHours: '10:00 AM — 10:00 PM',
  hotline: '+63 917 000 0001',
  quoteText: 'I have been going to the Baguio branch for three years and I have never once had a rushed session. The therapists actually listen when you tell them where it hurts. The foot soak before you start is worth the trip on its own.',
  quoteAuthor: 'Carmela Ramos',
  quoteMeta: 'Baguio City (Regular since 2023)',
};

export const DEFAULT_BRANCHES: Branch[] = BRANCHES.map(b => ({ ...b }));

export const DEFAULT_ACCOMMODATIONS: SpaPackage[] = SPA_PACKAGES.map(p => ({ ...p }));

export const DEFAULT_SERVICES: Service[] = SERVICES.map(s => ({ ...s }));

export const DEFAULT_FAQS: FAQ[] = FAQS.map(f => ({ ...f }));

const LOCAL_STORAGE_KEY = 'sdi_cms_data';
const INITIALIZED_KEY = 'sdi_cms_initialized';

const blankState = (): CMSData => ({
  hero: BLANK_HERO,
  about: BLANK_ABOUT,
  branches: BLANK_BRANCHES,
  accommodations: BLANK_ACCOMMODATIONS,
  services: BLANK_SERVICES,
  faqs: BLANK_FAQS,
});

// Load CMS Data. Defaults to Blank Slate if not initialized.
export function getCMSData(): CMSData {
  if (typeof window === 'undefined') return blankState();

  const isInitialized = localStorage.getItem(INITIALIZED_KEY);
  if (!isInitialized) {
    // Return blank state on first load!
    const initialBlankData = blankState();
    saveCMSData(initialBlankData);
    localStorage.setItem(INITIALIZED_KEY, 'true');
    return initialBlankData;
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CMSData;
      // A cache written before branches existed would leave the booking portal
      // with nothing to pick from, so backfill the field rather than trusting it.
      if (!Array.isArray(parsed.branches) || parsed.branches.length === 0) {
        parsed.branches = BLANK_BRANCHES;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading CMS data', e);
  }

  // Fallback
  return blankState();
}

export function saveCMSData(data: CMSData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}

export function resetToBlankSlate(): CMSData {
  const blank = blankState();
  saveCMSData(blank);
  return blank;
}

export function seedDefaultData(): CMSData {
  const defaults: CMSData = {
    hero: DEFAULT_HERO,
    about: DEFAULT_ABOUT,
    branches: DEFAULT_BRANCHES,
    accommodations: DEFAULT_ACCOMMODATIONS,
    services: DEFAULT_SERVICES,
    faqs: DEFAULT_FAQS,
  };
  saveCMSData(defaults);
  return defaults;
}

// Pre-seeded image gallery to help the Admin easily select high quality spa images
export const HIGH_QUALITY_PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1000', name: 'Candles & Warm Light' },
  { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000', name: 'Towels & Hot Stones' },
  { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1000', name: 'Treatment Room' },
  { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000', name: 'Back Massage' },
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000', name: 'Facial Treatment' },
  { url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=1000', name: 'Spa Interior' },
  { url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&q=80&w=1000', name: 'Aromatherapy Oils' },
];
