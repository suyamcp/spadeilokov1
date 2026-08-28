import { Accommodation, Service, FAQ } from '../types';

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
  elevation: string;
  climate: string;
  latitude: string;
  longitude: string;
  quoteText: string;
  quoteAuthor: string;
  quoteMeta: string;
}

export interface CMSData {
  hero: HeroCMS;
  about: AboutCMS;
  accommodations: Accommodation[];
  services: Service[];
  faqs: FAQ[];
}

// 1. BLANK SLATE STRUCTURES (Initial state on first run, as requested)
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
  elevation: '',
  climate: '',
  latitude: '',
  longitude: '',
  quoteText: '',
  quoteAuthor: '',
  quoteMeta: '',
};

export const BLANK_ACCOMMODATIONS: Accommodation[] = [
  {
    id: 'luxury-cabin',
    name: '',
    type: 'luxury_cabin',
    description: '',
    capacity: 0,
    price: 0,
    features: [],
    imageUrl: '',
    quantity: 0
  },
  {
    id: 'deluxe-glamping',
    name: '',
    type: 'glamping_tent',
    description: '',
    capacity: 0,
    price: 0,
    features: [],
    imageUrl: '',
    quantity: 0
  },
  {
    id: 'standard-pitching',
    name: '',
    type: 'standard_tent',
    description: '',
    capacity: 0,
    price: 0,
    features: [],
    imageUrl: '',
    quantity: 0
  }
];

export const BLANK_SERVICES: Service[] = [
  {
    id: 'camping-cafe',
    name: '',
    description: '',
    image: '',
    price: '',
    details: []
  },
  {
    id: 'outdoor-adventure',
    name: '',
    description: '',
    image: '',
    price: '',
    details: []
  },
  {
    id: 'amenities-convenience',
    name: '',
    description: '',
    image: '',
    price: '',
    details: []
  }
];

export const BLANK_FAQS: FAQ[] = [];

// 2. DEFAULT SEED DATA (To easily populate the site with standard Valleypoint content)
export const DEFAULT_HERO: HeroCMS = {
  backgroundImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80&w=1600',
  tagline: 'BENGUET VALLEY SANCTUARY',
  title: 'Valleypoint Campsite',
  description: 'Rest above the clouds. Experience luxurious floor-to-ceiling glass-front cabins, warm firepits, specialty Cordillera cafe cuisine, and targets shooting under high mountain pine mists.',
};

export const DEFAULT_ABOUT: AboutCMS = {
  tagline: 'OUR MOUNTAIN STORY',
  title: 'Where Cozy Mountain Cabins Meet the Wilderness Mist',
  desc1: 'Situated in the elevated municipality of Tuba, Benguet—just 15 minutes away from downtown Baguio City—Valleypoint Campsite is a sanctuary nestled in high alpine pine ridges. Designed for souls pursuing escape, we blend the rustic thrills of deep nature camping with premium glamping comforts.',
  desc2: 'Whether you are waking up inside our glass-front luxury wooden cabins to watch the sea of clouds accumulate, target shooting on our archery range, or sharing stories over a toasted marshmallow cup at our Overlook Cafe, Valleypoint creates experiences that stick.',
  elevation: '5,140 FT ASL',
  climate: '14°C — 19°C',
  latitude: '16.3792° N',
  longitude: '120.5755° E',
  quoteText: 'Our stay inside the Glass Loft Cabin was phenomenal. Watching the heavy Benguet fog roll into the valley at sunset while wrapping up in heated blankets drinking brewed coffee was magic. Unmatched mountain hospitality!',
  quoteAuthor: 'Maverick Villanueva',
  quoteMeta: 'Manila, Philippines (Stayed May 2026)',
};

export const DEFAULT_ACCOMMODATIONS: Accommodation[] = [
  {
    id: 'luxury-cabin',
    name: 'Glass-Front Luxury Cabin',
    type: 'luxury_cabin',
    description: 'Enclosed wooden loft cabin featuring massive floor-to-ceiling panoramic glass windows facing the misty valley. Warm wooden frame, orthopaedic queen bed, high-speed Wi-Fi, private heated washroom, and a personal viewing terrace.',
    capacity: 2,
    price: 4999,
    features: [
      'Queen Bed & Premium Linens',
      'En-suite Heated Bathroom',
      'Floor-to-Ceiling Valley View',
      'Complimentary Cordillera Breakfast',
      'Private Outdoor Veranda',
      'Power Outlets & USB Ports',
      'In-room Coffee & Tea Station'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=1000',
    quantity: 4
  },
  {
    id: 'deluxe-glamping',
    name: 'Deluxe Glamping Suite Tent',
    type: 'glamping_tent',
    description: 'Experience the wilderness of Tuba with supreme comfort. This spacious dome tent comes with double orthopaedic beds, cozy down pillows, thermal rugs, personal electricity panels, campfire firepit access, and stunning sunrise view.',
    capacity: 4,
    price: 3200,
    features: [
      '2 Double Beds (Up to 4 Pax)',
      'Heated Electric Blankets',
      'Cozy Warm Lighting & Fan',
      'Dedicated Bonfire Access',
      'Shared Luxury Hot Showers',
      'Charging Ports',
      'Morning Sea of Clouds View'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&q=80&w=1000',
    quantity: 8
  },
  {
    id: 'standard-pitching',
    name: 'Premium Adventure Pitching Site',
    type: 'standard_tent',
    description: 'For authentic outdoor campers. Includes a perfectly manicured grass campsite terrace in the pines, gear setups, thermal sleeping bags, high-density pads, and access to all campsite amenities like showers, archery, and Cafe.',
    capacity: 2,
    price: 1200,
    features: [
      'Premium High-Wind Tent Provided',
      '2 Sleeping Bags & Insulated Mats',
      'Free Access to Archery & Darts',
      'Shared Bathroom with Rain Shower',
      'Campsite Bonfire Circle Pass',
      'Outdoor Picnic Table Access',
      'Bring Your Own Tent option also'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1000',
    quantity: 15
  }
];

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'camping-cafe',
    name: 'Overlook Cafe & Restaurant',
    description: 'Sit back and enjoy the mountain views while sipping gourmet native coffee and specialty local comfort food.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1000',
    price: 'A la carte (from ₱110)',
    details: [
      'Indoor lounge & outdoor cliffside viewing deck',
      'Serves craft beers and hot specialty winter concoctions',
      'Cozy fireplace seating',
      'Board game selections available for diners'
    ]
  },
  {
    id: 'outdoor-adventure',
    name: 'Recreational Activities & Shooting Range',
    description: 'Connect with nature and challenge friends in our target courses and outdoor activities.',
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1000',
    price: '₱250 - ₱500 per activities',
    details: [
      'High-safety professional archery ranges',
      'Cliffside board game areas & darts console',
      'Scenic woodland trails for mountain jogging',
      'Outdoor movie cinema nights (weather permitting)'
    ]
  },
  {
    id: 'amenities-convenience',
    name: 'Glamping Conveniences & Care',
    description: 'Enjoy nature without compromise. We ensure absolute sanitation, security, and warmth.',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000',
    price: 'Included in stay',
    details: [
      'Luxury clean washrooms with high-pressure gas heaters',
      '24/7 security wardens and campsite perimeter lights',
      'Campsite charging stations & free High-speed Starlink Wi-Fi',
      'Available backup generator sets for continuous power'
    ]
  }
];

export const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'f1',
    question: 'How do we get to Valleypoint Campsite from Baguio?',
    answer: 'We are situated in Greenvalley, Santo Tomas Road, Tuba, Benguet. By private car, navigate via Waze/Google Maps to "Valleypoint Campsite". It is roughly a 15-20 minute scenic drive from Baguio City Session Road. Public taxis are also readily available, or you can take a jeepney departing from the Baguio Plaza to Greenvalley.',
    category: 'booking'
  },
  {
    id: 'f2',
    question: 'What is the climate like at the campsite?',
    answer: 'Being elevated in Tuba/Santo Tomas mountain ridges, our weather is extremely crisp and chilly—frequently colder than downtown Baguio itself. Temperatures regularly hover between 11°C to 18°C, with beautiful heavy mists and fog rolling in by mid-afternoon. Be sure to pack thermal layers, windbreakers, and sturdy shoes.',
    category: 'stay'
  },
  {
    id: 'f3',
    question: 'Are pets allowed inside the cabins and campsite?',
    answer: 'Yes! We are proud to be entirely pet-friendly. We welcome your fur babies to enjoy our lush grassy terrain. However, we ask pet parents to ensure their pets are on-leash in shared cafe grounds, and that you bring their cozy sleeping bedding and clean up after them.',
    category: 'policies'
  },
  {
    id: 'f4',
    question: 'Is there mobile signal and Wi-Fi coverage?',
    answer: 'Yes! We have high-speed Starlink Wi-Fi router coverage across the main cafe, patio, cabins, and glamping sites. Mobile networks (Smart, Globe) have reliable 4G/5G connections on most parts of our ridge.',
    category: 'amenities'
  }
];

const LOCAL_STORAGE_KEY = 'valleypoint_cms_data';
const INITIALIZED_KEY = 'valleypoint_cms_initialized';

// Load CMS Data. Defaults to Blank Slate if not initialized.
export function getCMSData(): CMSData {
  if (typeof window === 'undefined') {
    return {
      hero: BLANK_HERO,
      about: BLANK_ABOUT,
      accommodations: BLANK_ACCOMMODATIONS,
      services: BLANK_SERVICES,
      faqs: BLANK_FAQS
    };
  }

  const isInitialized = localStorage.getItem(INITIALIZED_KEY);
  if (!isInitialized) {
    // Return blank state on first load!
    const initialBlankData: CMSData = {
      hero: BLANK_HERO,
      about: BLANK_ABOUT,
      accommodations: BLANK_ACCOMMODATIONS,
      services: BLANK_SERVICES,
      faqs: BLANK_FAQS
    };
    saveCMSData(initialBlankData);
    localStorage.setItem(INITIALIZED_KEY, 'true');
    return initialBlankData;
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading CMS data', e);
  }

  // Fallback
  return {
    hero: BLANK_HERO,
    about: BLANK_ABOUT,
    accommodations: BLANK_ACCOMMODATIONS,
    services: BLANK_SERVICES,
    faqs: BLANK_FAQS
  };
}

export function saveCMSData(data: CMSData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}

export function resetToBlankSlate(): CMSData {
  const blank: CMSData = {
    hero: BLANK_HERO,
    about: BLANK_ABOUT,
    accommodations: BLANK_ACCOMMODATIONS,
    services: BLANK_SERVICES,
    faqs: BLANK_FAQS
  };
  saveCMSData(blank);
  return blank;
}

export function seedDefaultData(): CMSData {
  const defaults: CMSData = {
    hero: DEFAULT_HERO,
    about: DEFAULT_ABOUT,
    accommodations: DEFAULT_ACCOMMODATIONS,
    services: DEFAULT_SERVICES,
    faqs: DEFAULT_FAQS
  };
  saveCMSData(defaults);
  return defaults;
}

// Pre-seeded image gallery to help the Admin easily select high quality mountain images
export const HIGH_QUALITY_PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80&w=1000', name: 'Cabin Night Mists' },
  { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=1000', name: 'Glass front Cabin day' },
  { url: 'https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&q=80&w=1000', name: 'Cozy Dome Glamping Tent' },
  { url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1000', name: 'Pine Forest Pitching tent' },
  { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1000', name: 'Highland Overlook Cafe' },
  { url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1000', name: 'Archery / Shooting Target' },
  { url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000', name: 'Luxury Clean Showers' },
];
