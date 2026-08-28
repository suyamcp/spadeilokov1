import { Accommodation, AddOn, MenuItem, FAQ, Service } from './types';

export const ACCOMMODATIONS: Accommodation[] = [
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

export const ADD_ONS: AddOn[] = [
  {
    id: 'bonfire-kit',
    name: 'Private Bonfire Log & Marshmallow Kit',
    price: 450,
    description: 'A bundle of dry pine firewood, marshmallow skewers, chocolate bars, and graham crackers for a traditional smores night.',
    icon: 'Flame'
  },
  {
    id: 'archery-pass',
    name: 'Unlimited Archery & Darts Pass',
    price: 250,
    description: 'Full equipment rental and safety coordinator supervision on our high-slope target range fields.',
    icon: 'Target'
  },
  {
    id: 'cordillera-breakfast',
    name: 'Cordillera Pork Longganisa Breakfast Platter',
    price: 350,
    description: 'Gourmet garlic rice, locally spiced longganisa, fried egg, mountain tomatoes, and a mug of Benguet dark brew.',
    icon: 'Coffee'
  },
  {
    id: 'trekking-guide',
    name: 'Guided Pine Valley Trek (Sunrise)',
    price: 600,
    description: 'A morning guided hike up the mountain ridges of Tuba to catch the magnificent sea-of-clouds sunrise.',
    icon: 'Compass'
  }
];

export const CAFE_MENU: MenuItem[] = [
  {
    id: 'c1',
    name: 'Benguet Highland Brewed Coffee',
    category: 'beverages',
    price: 110,
    description: 'Classic dark roast coffee made of premium Arabica and Robusta beans sourced straight from the farmers in Benguet.',
    isBestseller: true
  },
  {
    id: 'c2',
    name: 'Campfire S’Mores Latte',
    category: 'beverages',
    price: 165,
    description: 'Steamed milk, double espresso, gourmet chocolate, topped with whipped cream and a toasted campfire marshmallow.',
    isBestseller: true
  },
  {
    id: 'c3',
    name: 'Local Mountain Strawberry Tea',
    category: 'beverages',
    price: 130,
    description: 'Infused fresh Baguio strawberries, wild honey, and freshly brewed mountain black tea leaves.'
  },
  {
    id: 'm1',
    name: 'Valleypoint Signature Pinikpikan',
    category: 'meals',
    price: 390,
    description: 'Traditional Cordilleran chicken soup smoked with salted pork etag, ginger, and Highland vegetables. Warm and deeply comforting.',
    isBestseller: true
  },
  {
    id: 'm2',
    name: 'Baguio Garlic Rice & Longganisa',
    category: 'meals',
    price: 280,
    description: 'Fragrant buttered garlic rice served with authentic sweet-spicy local skinless longganisa, salted eggs, and pickled papaya.'
  },
  {
    id: 'm3',
    name: 'Highland Barbecue Pork Skewers (3pcs)',
    category: 'meals',
    price: 260,
    description: 'Tender pork loin cuts marinated in local honey and native chili spices, wood-grilled to perfection on red coals.'
  },
  {
    id: 'd1',
    name: 'Highland Strawberry Lava Cake',
    category: 'desserts',
    price: 195,
    description: 'Molten warm core dark chocolate cake topped with a generous reduction of freshly-picked Benguet strawberries and vanilla bean ice cream.'
  },
  {
    id: 'd2',
    name: 'S’Mores Campfire Skillet',
    category: 'desserts',
    price: 220,
    description: 'A hot cast-iron skillet loaded with melted milk chocolate chips under a toasted duvet of fluffy marshmallow domes. Served with crackers.',
    isBestseller: true
  },
  {
    id: 's1',
    name: 'Highland Loaded Fries',
    category: 'snacks',
    price: 180,
    description: 'Hand-cut local potatoes dusted with salt-ground mountain rosemary, loaded with warm cheese melt and smoked bacon bits.'
  }
];

export const SERVICES: Service[] = [
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

export const FAQS: FAQ[] = [
  {
    id: 'f1',
    question: 'How do we get to Valleypoint Campsite from Baguio?â',
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
  },
  {
    id: 'f5',
    question: 'What is your rescheduling and cancellation policy?',
    answer: 'Cancellations made 7 days prior to check-in are eligible for a 100% full booking refund. Cancellations made between 3 to 6 days prior get a 50% refund. We support 1-time free date rescheduling due to extreme weather warnings up to 24 hours prior to check-in, subject to cabin availability.',
    category: 'policies'
  },
  {
    id: 'f6',
    question: 'Do we need to bring our own food and cooking gear?',
    answer: 'You are welcome to bring snacks! However, heavy raw-food cooking is restricted to dedicated grilling pits to prevent forest risks. Our lovely Overlook Cafe offers a highly-rated menu of delicious hot dishes, drinks, local specialties, and desserts at reasonable prices, open daily from 6:30 AM to 10:00 PM.',
    category: 'stay'
  }
];
