import { SpaPackage, AddOn, FAQ, Service, Branch } from './types';

/**
 * The Spa de Iloko branch network.
 *
 * These ids are stable keys: every treatment room in the database is stamped
 * with one, and the availability calendar counts occupancy per branch. Renaming
 * a branch in the Admin Panel changes only the label -- never the id -- so
 * existing bookings keep pointing at the right location.
 *
 * `code` is the two-letter tag used inside generated room numbers (SG-BG-01).
 */
export const BRANCHES: Branch[] = [
  {
    id: 'baguio',
    name: 'Baguio City Branch',
    city: 'Baguio City',
    address: 'Session Road, Baguio City, Benguet',
    phone: '+63 917 000 0001',
    hours: '10:00 AM — 10:00 PM daily',
  },
  {
    id: 'laoag',
    name: 'Laoag City Branch',
    city: 'Laoag City',
    address: 'J.P. Rizal Street, Laoag City, Ilocos Norte',
    phone: '+63 917 000 0002',
    hours: '10:00 AM — 10:00 PM daily',
  },
  {
    id: 'vigan',
    name: 'Vigan City Branch',
    city: 'Vigan City',
    address: 'Quezon Avenue, Vigan City, Ilocos Sur',
    phone: '+63 917 000 0003',
    hours: '10:00 AM — 10:00 PM daily',
  },
  {
    id: 'san-fernando',
    name: 'San Fernando Branch',
    city: 'San Fernando',
    address: 'Quezon Avenue, San Fernando, La Union',
    phone: '+63 917 000 0004',
    hours: '10:00 AM — 10:00 PM daily',
  },
  {
    id: 'dagupan',
    name: 'Dagupan City Branch',
    city: 'Dagupan City',
    address: 'A.B. Fernandez Avenue, Dagupan City, Pangasinan',
    phone: '+63 917 000 0005',
    hours: '10:00 AM — 10:00 PM daily',
  },
  {
    id: 'urdaneta',
    name: 'Urdaneta City Branch',
    city: 'Urdaneta City',
    address: 'Alexander Street, Urdaneta City, Pangasinan',
    phone: '+63 917 000 0006',
    hours: '10:00 AM — 10:00 PM daily',
  },
];

/** Two-letter tags used when generating treatment-room numbers per branch. */
export const BRANCH_CODES: Record<string, string> = {
  baguio: 'BG',
  laoag: 'LA',
  vigan: 'VG',
  'san-fernando': 'SF',
  dagupan: 'DG',
  urdaneta: 'UR',
};

export const getBranchById = (id: string): Branch | undefined =>
  BRANCHES.find(b => b.id === id);

export const SPA_PACKAGES: SpaPackage[] = [
  {
    id: 'signature-suite',
    name: "Signature Couple's Suite",
    type: 'signature_suite',
    description: 'Our most private room, laid out for two side-by-side beds under warm rattan lighting. A full ninety-minute signature massage each, with a herbal foot soak to open and hot ginger tea to close.',
    capacity: 2,
    price: 2499,
    features: [
      '90-Minute Signature Massage for Two',
      'Private En-suite Shower Room',
      'Herbal Foot Soak on Arrival',
      'Warm Bamboo & Aromatherapy Oils',
      'Hot Ginger Tea & Light Snack',
      'Robes, Slippers & Fresh Linens',
      'Lockers & Personal Attendant',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000',
    quantity: 2,
  },
  {
    id: 'deluxe-room',
    name: 'Deluxe Treatment Room',
    type: 'deluxe_room',
    description: 'A curtained private room for one or two guests. Choose a Swedish, Shiatsu, or aromatherapy full-body massage, finished with a warm back scrub and a hot towel wrap.',
    capacity: 2,
    price: 1499,
    features: [
      '60-Minute Full-Body Massage',
      'Swedish, Shiatsu or Aromatherapy',
      'Warm Back Scrub & Hot Towels',
      'Private Curtained Room',
      'Complimentary Herbal Tea',
      'Robes & Fresh Linens',
      'Air-conditioned Quiet Floor',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1000',
    quantity: 4,
  },
  {
    id: 'classic-room',
    name: 'Classic Hilot Room',
    type: 'classic_room',
    description: 'Traditional Ilocano hilot on a single bed in our shared quiet lounge. Warm coconut oil, firm pressure, and the same trained therapists — the everyday reset our regulars come back for.',
    capacity: 1,
    price: 799,
    features: [
      '60-Minute Traditional Hilot',
      'Warm Virgin Coconut Oil',
      'Shared Quiet Lounge',
      'Complimentary Herbal Tea',
      'Fresh Linens Every Session',
      'Lockers Provided',
      'Walk-ins Welcome When Free',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000',
    quantity: 6,
  },
];

export const ADD_ONS: AddOn[] = [
  {
    id: 'hot-stone',
    name: 'Hot Stone Upgrade',
    price: 350,
    description: 'Heated basalt stones worked along the back and shoulders to loosen deep tension before the massage proper begins.',
    icon: 'Flame',
  },
  {
    id: 'foot-soak',
    name: 'Herbal Foot Scrub & Soak',
    price: 250,
    description: 'A twenty-minute soak in warm water steeped with lemongrass and sea salt, followed by a full foot and calf scrub.',
    icon: 'Droplets',
  },
  {
    id: 'ginger-tea',
    name: 'Ginger Tea & Wellness Snack',
    price: 150,
    description: 'Hot salabat brewed from native ginger, served with honey and a small plate of local rice cakes after your session.',
    icon: 'Leaf',
  },
  {
    id: 'aroma-oil',
    name: 'Premium Aromatherapy Oil',
    price: 200,
    description: 'Upgrade to our premium blend — lavender, eucalyptus, or ylang-ylang in a cold-pressed virgin coconut oil base.',
    icon: 'Sparkles',
  },
];

export const SERVICES: Service[] = [
  {
    id: 'massage-therapy',
    name: 'Massage & Body Therapy',
    description: 'Trained therapists, traditional Ilocano hilot, and the full range of modern bodywork in private, quiet rooms.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000',
    price: 'From ₱799 per session',
    details: [
      'Traditional Ilocano hilot and Swedish massage',
      'Shiatsu, aromatherapy and deep-tissue options',
      'Hot stone therapy and warm bamboo massage',
      'Body scrubs, wraps and back treatments',
    ],
  },
  {
    id: 'beauty-wellness',
    name: 'Facial, Nail & Beauty Care',
    description: 'Skin and hand care using gentle, locally sourced products — booked alongside a massage or on its own.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000',
    price: '₱350 — ₱1,200 per service',
    details: [
      'Deep-cleansing and hydrating facials',
      'Manicure, pedicure and paraffin hand treatment',
      'Warm foot spa with herbal soak',
      'Ear candling and head-and-scalp therapy',
    ],
  },
  {
    id: 'spa-amenities',
    name: 'Spa Comforts & Care',
    description: 'Every branch is kept to the same standard, so the room you walk into is the same whichever city you are in.',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=1000',
    price: 'Included with every session',
    details: [
      'Fresh linens, robes and slippers for every guest',
      'Private shower rooms and secure lockers',
      'Air-conditioned quiet floors and soft lighting',
      'Complimentary herbal tea and drinking water',
    ],
  },
];

export const FAQS: FAQ[] = [
  {
    id: 'f1',
    question: 'Which Spa de Iloko branches can I book?',
    answer: 'We currently operate six branches — Baguio City, Laoag City, Vigan City, San Fernando (La Union), Dagupan City, and Urdaneta City. Pick your branch first in the booking portal; the availability calendar then shows only the rooms free at that location.',
    category: 'booking',
  },
  {
    id: 'f2',
    question: 'Do I need to book in advance, or can I walk in?',
    answer: 'Walk-ins are welcome whenever a room is free, but weekends and evenings fill up quickly. Booking online holds a treatment room for your chosen date at your chosen branch, so we recommend reserving at least a day ahead.',
    category: 'booking',
  },
  {
    id: 'f3',
    question: 'What should I expect during my first session?',
    answer: 'Arrive about ten minutes early. You will be shown to a locker and given a robe and slippers, then offered a herbal foot soak while your therapist prepares the room. Tell your therapist about any injuries, allergies, or pressure preferences — they will adjust throughout.',
    category: 'treatments',
  },
  {
    id: 'f4',
    question: 'What is included with every treatment?',
    answer: 'Fresh linens, a robe and slippers, a secure locker, use of our shower rooms, and complimentary herbal tea after your session. Air-conditioning and quiet-floor rules apply at every branch.',
    category: 'amenities',
  },
  {
    id: 'f5',
    question: 'Can I reschedule or cancel my appointment?',
    answer: 'Yes. Unpaid reservations can be released instantly from the "Verify & Manage Reservation" tab using your reference code. For a reservation you have already paid for, contact your branch at least 24 hours before your appointment and we will move it to another date free of charge.',
    category: 'policies',
  },
  {
    id: 'f6',
    question: 'Are there treatments I should avoid?',
    answer: 'Please tell us in advance if you are pregnant, recovering from surgery, or being treated for a heart condition, high blood pressure, or a skin condition. Some treatments — hot stone and deep-tissue especially — are not suitable, and our therapists will recommend a gentler alternative.',
    category: 'policies',
  },
];
