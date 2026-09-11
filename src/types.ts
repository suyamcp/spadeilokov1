/** Which room grade a bookable package occupies. Drives the badge on the cards. */
export type PackageType = 'signature_suite' | 'deluxe_room' | 'classic_room';

/** One physical Spa de Iloko location a client can book an appointment at. */
export interface Branch {
  id: string;        // stable slug — stored on every room/booking, never renamed
  name: string;      // e.g. "Baguio City Branch"
  city: string;      // short label used in compact chips
  address: string;
  phone: string;
  hours: string;
}

/**
 * A bookable spa package. `quantity` is how many treatment rooms of this grade
 * each branch runs, which is what the availability calendar counts down.
 */
export interface SpaPackage {
  id: string;
  name: string;
  type: PackageType;
  description: string;
  capacity: number; // max clients per session
  price: number;    // price per session
  features: string[];
  imageUrl: string;
  quantity: number; // treatment rooms of this grade, per branch
}

export interface Booking {
  id: string;
  reference?: string; // SDI-XXXXXX code the client quotes
  branchId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkIn: string;  // YYYY-MM-DD — the appointment date
  checkOut: string; // YYYY-MM-DD — always the day after checkIn; the room is held for that day
  accommodationId: string; // package slug
  guestsCount: number;
  totalAmount: number;
  addOns: { id: string; name: string; price: number }[];
  status: 'confirmed' | 'pending' | 'paid_pending_review' | 'checked_in' | 'checked_out' | 'cancelled' | 'rejected' | 'no_show';
  notes?: string;
  createdAt: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'booking' | 'treatments' | 'amenities' | 'policies';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  details: string[];
}
