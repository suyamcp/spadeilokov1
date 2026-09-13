import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Flame,
  Droplets,
  Leaf,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Info,
  CalendarCheck,
  MapPin,
  Building2,
  Trash2,
  Clock3,
  Printer
} from 'lucide-react';
import { SpaPackage, AddOn, Booking, Branch } from '../types';
import { ADD_ONS } from '../data';

// Reservation statuses that occupy a treatment room. Mirrors the server's availability query.
const HOLDS_A_ROOM = new Set(['confirmed', 'pending', 'paid_pending_review']);

/** Badge label for each package grade. */
const PACKAGE_LABEL: Record<string, string> = {
  signature_suite: 'Signature Suite',
  deluxe_room: 'Deluxe Room',
  classic_room: 'Classic Room',
};

// Helper to format date as YYYY-MM-DD
const formatDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to check if date is in past
const isPastDate = (dateStr: string): boolean => {
  const todayStr = formatDateStr(new Date()); // Current actual local date
  return dateStr < todayStr;
};

/**
 * An appointment holds its treatment room for the whole of one day, which the
 * database records as a half-open [check-in, check-out) range. So the day after
 * the appointment is the check-out date.
 */
const dayAfter = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  return formatDateStr(next);
};

// Map Icon name to Lucide Icon
const getAddOnIcon = (iconName: string) => {
  switch (iconName) {
    case 'Flame': return <Flame className="w-5 h-5 text-amber-500" />;
    case 'Droplets': return <Droplets className="w-5 h-5 text-sky-500" />;
    case 'Leaf': return <Leaf className="w-5 h-5 text-emerald-500" />;
    default: return <Sparkles className="w-5 h-5 text-gold-500" />;
  }
};

interface BookingSystemProps {
  initialAccommodationId?: string;
  initialBranchId?: string;
  onBookingSuccess?: () => void;
  branches: Branch[];
  accommodations: SpaPackage[];
  bookings: Booking[];
  onBookingsChange: (bookings: Booking[]) => void;
}

export default function BookingSystem({
  initialAccommodationId,
  initialBranchId,
  onBookingSuccess,
  branches,
  accommodations,
  bookings,
  onBookingsChange: setBookings
}: BookingSystemProps) {
  // --- STATE ---
  const bookableBranches = branches.filter(b => b.id && b.name);

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialBranchId || bookableBranches[0]?.id || ''
  );
  const [selectedAcc, setSelectedAcc] = useState<SpaPackage>(
    accommodations.find(a => a.id === initialAccommodationId) || accommodations[0]
  );

  // Sync selectedAcc if accommodations prop changes
  useEffect(() => {
    const currentSelectedId = selectedAcc?.id || initialAccommodationId || 'signature-suite';
    const match = accommodations.find(a => a.id === currentSelectedId) || accommodations[0];
    if (match) {
      setSelectedAcc(match);
    }
  }, [accommodations, initialAccommodationId]);

  // A branch list that arrives after the first render (or an admin removing a
  // branch) must never leave the portal pointing at a location we cannot book.
  useEffect(() => {
    if (bookableBranches.length === 0) return;
    if (!bookableBranches.some(b => b.id === selectedBranchId)) {
      setSelectedBranchId(bookableBranches[0].id);
    }
  }, [branches, selectedBranchId]);

  // Follow a branch pre-selected from the branch directory further up the page.
  useEffect(() => {
    if (initialBranchId && bookableBranches.some(b => b.id === initialBranchId)) {
      setSelectedBranchId(initialBranchId);
    }
  }, [initialBranchId, branches]);

  const selectedBranch = bookableBranches.find(b => b.id === selectedBranchId);

  // Appointment date. One booking holds one treatment room for one day.
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Extras and guests
  const [guests, setGuests] = useState<number>(1);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Add-on Quantity State
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [addOnsCatalog, setAddOnsCatalog] = useState<AddOn[]>([]);

  // Fetch dynamic add-ons on load
  useEffect(() => {
    fetch('/api/add-ons')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAddOnsCatalog(data.map((ao: any) => ({
            id: String(ao.id),
            name: ao.name,
            price: Number(ao.price),
            // The catalog table has no icon column, so match the seeded name back
            // to the local list rather than guessing from the row id.
            icon: ADD_ONS.find(local => local.name === ao.name)?.icon || 'Sparkles',
            description: ao.description || '',
          })));
        } else {
          setAddOnsCatalog(ADD_ONS);
        }
      })
      .catch(err => {
        console.error('Failed to load add-ons, falling back:', err);
        setAddOnsCatalog(ADD_ONS);
      });
  }, []);

  // Contact details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<number>(1); // 1: Branch, package & date, 2: Details, 3: Ticket
  const [newBookingResult, setNewBookingResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Custom interactive tab for user to view booking status
  const [activeSubTab, setActiveSubTab] = useState<'book' | 'manage'>('book');
  const [searchBookingRef, setSearchBookingRef] = useState<string>('');
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(null);
  const [searchError, setSearchError] = useState<string>('');

  // The calendar reads real occupancy straight from the `bookings` prop, which the
  // parent keeps in sync with the server's live availability. No local mock data.

  // Update selection if prop changes
  useEffect(() => {
    if (initialAccommodationId) {
      const match = accommodations.find(a => a.id === initialAccommodationId);
      if (match) setSelectedAcc(match);
    }
  }, [initialAccommodationId, accommodations]);

  // Adjust guests according to the room's capacity limit
  useEffect(() => {
    if (selectedAcc && guests > selectedAcc.capacity) {
      setGuests(selectedAcc.capacity);
    }
  }, [selectedAcc, guests]);

  // A date that was free at one branch may be full at another, so re-check the
  // selection whenever the branch or the package changes.
  useEffect(() => {
    if (!appointmentDate) return;
    if (getAvailableInventoryOnDate(selectedBranchId, selectedAcc?.id, appointmentDate).available === 0) {
      setAppointmentDate('');
    }
  }, [selectedBranchId, selectedAcc]);

  // --- OCCUPANCY & AVAILABILITY ENGINE ---
  // How many rooms of this package are taken at THIS branch on a given date.
  const getOccupancyOnDate = (branchId: string, accId: string, dateStr: string): number => {
    let count = 0;
    bookings.forEach(booking => {
      // Whitelist, not blacklist: only these statuses actually hold a room.
      // Must stay in step with the status filter on the server's /api/availability query.
      if (!HOLDS_A_ROOM.has(booking.status)) return;
      if (booking.branchId !== branchId) return;
      if (booking.accommodationId === accId) {
        // A booking occupies dates from check-in up to (but not including) check-out
        if (dateStr >= booking.checkIn && dateStr < booking.checkOut) {
          count++;
        }
      }
    });
    return count;
  };

  // How many of the selected room grade are free at this branch on a given date.
  //
  // `unconfigured` is deliberately NOT the same as `booked`. A package with no
  // rooms behind it -- because the admin has not set a count yet, or because
  // /api/content failed and we are sitting on the blank fallback -- must never
  // be reported to a visitor as "Fully Booked". Saying a spa is sold out when
  // we simply have no data is worse than saying nothing.
  const getAvailableInventoryOnDate = (
    branchId: string,
    accId: string | undefined,
    dateStr: string
  ): { available: number; total: number; status: 'available' | 'limited' | 'booked' | 'unconfigured' } => {
    const acc = accommodations.find(a => a.id === accId) || selectedAcc;
    const total = Number(acc?.quantity) || 0;
    if (!acc || !branchId || total <= 0) {
      return { available: 0, total: 0, status: 'unconfigured' };
    }

    const occupied = getOccupancyOnDate(branchId, acc.id, dateStr);
    const available = Math.max(0, total - occupied);

    // "Few left" has to be relative to how many rooms this package actually has.
    // A flat `available <= 2` was written for the old 4/8/15 unit counts and marks
    // a 2-room package as scarce even when both rooms are free — false urgency.
    // Scarce means at most ~30% of the rooms remain, and never the full set.
    const lowWaterMark = Math.max(1, Math.ceil(total * 0.3));
    let status: 'available' | 'limited' | 'booked' = 'available';
    if (available === 0) {
      status = 'booked';
    } else if (available <= lowWaterMark && available < total) {
      status = 'limited';
    }

    return { available, total, status };
  };

  /** True once we actually know this branch/package has rooms to sell. */
  const inventoryKnown =
    !!selectedBranchId && Number(selectedAcc?.quantity) > 0;

  // --- CALENDAR GRID GENERATION (Custom Grid) ---
  const generateCurrentMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of current month
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 is Sunday, etc.

    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        dateStr: formatDateStr(prevDate),
        dayNum: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      days.push({
        dateStr: formatDateStr(currDate),
        dayNum: i,
        isCurrentMonth: true
      });
    }

    // Next month padding to complete standard 6-week grid
    const totalSlots = 42;
    const nextDaysNeeded = totalSlots - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: formatDateStr(nextDate),
        dayNum: i,
        isCurrentMonth: false
      });
    }

    return days;
  };

  // Handle calendar day clicks. An appointment is a single day, so a second click
  // simply moves the booking rather than opening a range.
  const handleDayClick = (dateStr: string) => {
    if (isPastDate(dateStr)) return; // No past dates
    if (getAvailableInventoryOnDate(selectedBranchId, selectedAcc?.id, dateStr).available === 0) return;
    setAppointmentDate(prev => (prev === dateStr ? '' : dateStr));
  };

  // --- COMPUTATIONS FOR BILLING ---
  const sessionsCount = appointmentDate ? 1 : 0;
  const basePrice = (selectedAcc?.price || 0) * sessionsCount;
  const addOnsPrice = selectedAddOns.reduce((total, addon) => {
    const qty = addOnQuantities[addon.id] || 1;
    return total + (addon.price * qty);
  }, 0);
  const subTotal = basePrice + addOnsPrice;
  const grandTotal = subTotal;

  // Toggle addons
  const handleToggleAddOn = (addon: AddOn) => {
    if (selectedAddOns.some(a => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
      const updated = { ...addOnQuantities };
      delete updated[addon.id];
      setAddOnQuantities(updated);
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
      setAddOnQuantities({ ...addOnQuantities, [addon.id]: 1 });
    }
  };

  const handleUpdateAddOnQuantity = (addonId: string, delta: number) => {
    const current = addOnQuantities[addonId] || 1;
    const next = Math.max(1, current + delta);
    setAddOnQuantities({ ...addOnQuantities, [addonId]: next });
  };

  // --- FORM SUBMISSION (Create Reservation) ---
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      alert('Please choose which branch you would like to book.');
      return;
    }
    if (!appointmentDate) {
      alert('Please select your appointment date.');
      return;
    }
    if (!customerName || !customerEmail || !customerPhone) {
      alert('Please fill out all contact information fields.');
      return;
    }

    setIsSubmitting(true);

    fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName,
        customerEmail,
        customerPhone,
        branchId: selectedBranchId,
        checkIn: appointmentDate,
        checkOut: dayAfter(appointmentDate),
        accommodationId: selectedAcc.id,
        guestsCount: guests,
        selectedAddOns: selectedAddOns.map(ao => ({ id: Number(ao.id) || 1, quantity: addOnQuantities[ao.id] || 1 })),
        notes,
      }),
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.error || 'Failed to create booking.');
        });
      }
      return res.json();
    })
    .then((result: any) => {
      // Reservation is held as "pending". Show the ticket with payment instructions;
      // staff confirm it once the client emails proof of payment.
      setNewBookingResult(result);
      setIsSubmitting(false);
      setBookingStep(3);
      // Bring the ticket itself into view (not the whole page) once it has rendered.
      setTimeout(() => {
        document.getElementById('booking_step_3_ticket')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      if (onBookingSuccess) onBookingSuccess();
    })
    .catch(error => {
      console.error('Error creating booking:', error);
      alert(error.message || 'An error occurred while saving your booking.');
      setIsSubmitting(false);
    });
  };

  // Cancel a still-unpaid reservation from the "Manage Bookings" tab.
  const handleCancelBooking = (reference: string) => {
    if (!window.confirm('Cancel this appointment? An unpaid hold will be released immediately. For an appointment you have already paid for, please contact your branch about a refund.')) {
      return;
    }
    fetch('/api/bookings/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to cancel booking.');
      return res.json();
    })
    .then((d: any) => {
      if (d.status === 'cancelled') {
        setSearchedBooking(prev => prev ? ({ ...prev, status: 'cancelled' }) : prev);
        alert('Appointment released successfully.');
      } else {
        alert('This appointment is already paid/confirmed. Please contact your branch to process a cancellation and any refund.');
      }
    })
    .catch(err => {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    });
  };

  // Booking details query handler — looks the reservation up on the server by reference code.
  const handleSearchBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedBooking(null);
    setSearchError('');

    const raw = searchBookingRef.trim().toUpperCase();
    if (!raw) {
      setSearchError('Please provide a booking Reference ID.');
      return;
    }
    // Codes issued before the rebrand carry the old prefix, so accept either and
    // only add ours when the visitor typed the bare code.
    const reference = /^(SDI|VP)-/.test(raw) ? raw : `SDI-${raw}`;

    fetch(`/api/bookings/lookup?reference=${encodeURIComponent(reference)}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((d: any) => {
        setSearchedBooking({
          id: d.reference,
          reference: d.reference,
          branchId: d.branchId || '',
          customerName: d.customerName,
          customerEmail: d.customerEmail,
          customerPhone: d.customerPhone,
          checkIn: d.checkIn,
          checkOut: d.checkOut,
          accommodationId: d.accommodationSlug,
          guestsCount: d.guestsCount,
          totalAmount: d.totalAmount,
          addOns: d.addOns || [],
          status: d.status,
          notes: d.notes,
          createdAt: d.createdAt || '',
          branchName: d.branchName,
          amountDue: d.amountDue,
          paymentStatus: d.paymentStatus,
        } as any);
      })
      .catch(() => {
        setSearchError('No reservation found under that reference number.');
      });
  };

  // Nav months. Never step behind the real current month — those days are all past.
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    const today = new Date();
    if (currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()) {
      return;
    }
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Check day state styles (selected, available, limited, sold out, past)
  const getDayClasses = (dateStr: string, isCurrentMonth: boolean) => {
    const isPast = isPastDate(dateStr);
    if (isPast) {
      return 'bg-neutral-900/10 text-neutral-400 font-light cursor-not-allowed line-through';
    }

    const { status } = getAvailableInventoryOnDate(selectedBranchId, selectedAcc?.id, dateStr);
    const isSelected = appointmentDate === dateStr;

    if (isSelected) {
      return 'bg-gold-500 text-ink font-bold scale-105 z-10 shadow-lg';
    }
    if (status === 'unconfigured') {
      // Neutral and quiet — we are not claiming anything about availability.
      return 'text-neutral-500 border border-sand-800/30 cursor-not-allowed opacity-60';
    }
    if (!isCurrentMonth) {
      return 'text-neutral-500 hover:bg-sand-800/40';
    }
    if (status === 'booked') {
      return 'bg-rose-500/10 text-rose-400 cursor-not-allowed border border-rose-500/20 relative before:content-[""] before:absolute before:w-1.5 before:h-1.5 before:bg-rose-500 before:rounded-full before:bottom-1 before:left-1/2 before:-translate-x-1/2';
    }
    if (status === 'limited') {
      return 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/20 relative before:content-[""] before:absolute before:w-1.5 before:h-1.5 before:bg-amber-500 before:rounded-full before:bottom-1 before:left-1/2 before:-translate-x-1/2';
    }
    return 'hover:bg-sand-700/40 text-emerald-50 border border-sand-800/40';
  };

  return (
    <div className="w-full bg-sand-900 border border-sand-800 rounded-3xl overflow-hidden shadow-2xl relative" id="booking_portal_wrapper">
      {/* Tab Selectors */}
      <div className="flex border-b border-sand-800 bg-sand-950/80 backdrop-blur" id="tab_select_container">
        <button
          onClick={() => { setActiveSubTab('book'); setBookingStep(1); }}
          className={`flex-1 py-5 text-center font-display font-medium text-sm transition-all relative ${
            activeSubTab === 'book' ? 'text-gold-400 bg-sand-900' : 'text-neutral-400 hover:text-emerald-100'
          }`}
          id="btn_tab_book"
        >
          <span className="flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Book an Appointment
          </span>
          {activeSubTab === 'book' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('manage')}
          className={`flex-1 py-5 text-center font-display font-medium text-sm transition-all relative ${
            activeSubTab === 'manage' ? 'text-gold-400 bg-sand-900' : 'text-neutral-400 hover:text-emerald-100'
          }`}
          id="btn_tab_manage"
        >
          <span className="flex items-center justify-center gap-2">
            <CalendarCheck className="w-4 h-4" /> Verify &amp; Manage Booking
          </span>
          {activeSubTab === 'manage' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
      </div>

      <div className="p-6 md:p-8" id="booking_tab_body">
        {/* --- PORTAL / BOOKING ENGINE TAB --- */}
        {activeSubTab === 'book' && (
          <div>
            {/* Step Indicators */}
            <div className="flex justify-center items-center gap-4 mb-8" id="step_indicator_bar">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs border ${
                  bookingStep >= 1 ? 'bg-gold-500 text-ink border-gold-500' : 'border-neutral-700 text-neutral-400'
                }`}>1</span>
                <span className={`text-xs font-medium ${bookingStep >= 1 ? 'text-gold-400' : 'text-neutral-500'}`}>Branch, Package &amp; Date</span>
              </div>
              <div className="w-8 h-[1px] bg-sand-800" />
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs border ${
                  bookingStep >= 2 ? 'bg-gold-500 text-ink border-gold-500' : 'border-neutral-700 text-neutral-400'
                }`}>2</span>
                <span className={`text-xs font-medium ${bookingStep >= 2 ? 'text-gold-400' : 'text-neutral-500'}`}>Extras &amp; Details</span>
              </div>
              <div className="w-8 h-[1px] bg-sand-800" />
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs border ${
                  bookingStep >= 3 ? 'bg-gold-500 text-ink border-gold-500' : 'border-neutral-700 text-neutral-400'
                }`}>3</span>
                <span className={`text-xs font-medium ${bookingStep >= 3 ? 'text-gold-400' : 'text-neutral-500'}`}>Reservation Ticket</span>
              </div>
            </div>

            {/* STEP 1: SELECT BRANCH, PACKAGE & DATE */}
            {bookingStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
                id="booking_step_1_layout"
              >
                {/* 1. Branch picker — the first decision, because it decides which
                       rooms the calendar below is even counting. */}
                <div className="space-y-4" id="branch_picker_list">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <h3 className="font-display font-semibold text-lg text-cream-50 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gold-400" />
                      <span>1. Choose Your Branch</span>
                    </h3>
                    {selectedBranch && (
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gold-500" /> {selectedBranch.address}
                      </span>
                    )}
                  </div>

                  {bookableBranches.length === 0 ? (
                    <div className="p-5 rounded-2xl border border-dashed border-sand-800 bg-sand-950/40 text-center text-xs text-neutral-500">
                      No branches are configured yet. Add your locations under Admin Panel → Branch Directory.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {bookableBranches.map((branch) => {
                        const isSelected = selectedBranchId === branch.id;
                        return (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => setSelectedBranchId(branch.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                              isSelected
                                ? 'bg-sand-850 border-gold-500 shadow-md'
                                : 'bg-sand-950/40 border-sand-800 hover:border-sand-700'
                            }`}
                            id={`branch_option_${branch.id}`}
                          >
                            <span className={`text-[9px] uppercase font-black tracking-widest font-display block ${isSelected ? 'text-gold-400' : 'text-neutral-500'}`}>
                              Branch
                            </span>
                            <span className="font-display font-semibold text-xs text-cream-50 block mt-1 leading-snug">
                              {branch.city || branch.name}
                            </span>
                            {branch.hours && (
                              <span className="text-[9px] text-neutral-500 flex items-center gap-1 mt-1.5">
                                <Clock3 className="w-2.5 h-2.5" /> {branch.hours}
                              </span>
                            )}
                            {isSelected && (
                              <span className="absolute right-2.5 top-2.5 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center text-ink">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* 2. Package picker (Left Column) */}
                  <div className="lg:col-span-4 space-y-4" id="package_picker_list">
                    <h3 className="font-display font-semibold text-lg text-cream-50 flex items-center gap-2">
                      <span>2. Choose Your Package</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {accommodations.map((acc) => {
                        const isSelected = selectedAcc?.id === acc.id;
                        return (
                          <div
                            key={acc.id}
                            onClick={() => setSelectedAcc(acc)}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden group ${
                              isSelected
                                ? 'bg-sand-850 border-gold-500 h-full shadow-md'
                                : 'bg-sand-950/40 border-sand-800 hover:border-sand-700'
                            }`}
                            id={`package_card_${acc.id}`}
                          >
                            {acc.imageUrl && (
                              <div className="absolute right-0 top-0 h-1/2 w-1/3 opacity-25 group-hover:opacity-40 transition-opacity">
                                <img src={acc.imageUrl} alt="" className="w-full h-full object-cover rounded-bl-3xl" referrerPolicy="no-referrer" />
                              </div>
                            )}

                            <div className="relative pr-12">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400 font-display">
                                {PACKAGE_LABEL[acc.type] || 'Treatment Room'}
                              </span>
                              <h4 className="font-display font-medium text-sm text-cream-50 mt-1">{acc.name}</h4>
                              <p className="text-xs text-neutral-400 mt-2 line-clamp-2 max-w-[85%]">{acc.description}</p>

                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-sand-800/60">
                                <span className="text-xs font-display font-bold text-gold-400">
                                  ₱{acc.price.toLocaleString()} <span className="font-light text-[10px] text-neutral-400">/ session</span>
                                </span>
                                <span className="text-[10px] flex items-center gap-1 text-neutral-400">
                                  <Users className="w-3 h-3 text-gold-500/80" /> Up to {acc.capacity} pax
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute right-4 bottom-4 w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center text-ink shadow">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Visual Availability Calendar (Center Column) */}
                  <div className="lg:col-span-5 flex flex-col" id="live_availability_calendar_node">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-semibold text-lg text-cream-50 flex items-center gap-2">
                        <span>3. Pick a Date</span>
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={prevMonth}
                          className="p-1.5 rounded-lg border border-sand-800 bg-sand-950/60 hover:bg-sand-800 text-neutral-300 transition-colors"
                          id="btn_prev_month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-xs font-display font-semibold text-gold-400 bg-sand-950 rounded-lg min-w-[110px] text-center">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={nextMonth}
                          className="p-1.5 rounded-lg border border-sand-800 bg-sand-950/60 hover:bg-sand-800 text-neutral-300 transition-colors"
                          id="btn_next_month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid Container */}
                    <div className="bg-sand-950/60 border border-sand-800 rounded-2xl p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {inventoryKnown ? (
                          selectedBranch && (
                            <p className="text-[10px] text-neutral-500 mb-3 text-center">
                              Showing availability for <span className="text-gold-400 font-semibold">{selectedBranch.name}</span>
                            </p>
                          )
                        ) : (
                          <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mb-3 leading-relaxed">
                            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
                            <span>
                              Availability for this package isn't loaded yet, so no dates can be selected.
                              Try reloading the page — if it persists, the treatment-room count for this
                              package still needs setting in the admin panel.
                            </span>
                          </div>
                        )}

                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                            <span key={d} className="text-[10px] uppercase font-bold text-neutral-500 font-display">{d}</span>
                          ))}
                        </div>

                        {/* Day Cells */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {generateCurrentMonthDays().map((daySlot, idx) => {
                            const dateStr = daySlot.dateStr;
                            const cellClasses = getDayClasses(dateStr, daySlot.isCurrentMonth);
                            return (
                              <button
                                key={`${dateStr}-${idx}`}
                                onClick={() => handleDayClick(dateStr)}
                                disabled={isPastDate(dateStr) || getAvailableInventoryOnDate(selectedBranchId, selectedAcc?.id, dateStr).available === 0}
                                className={`aspect-square sm:aspect-auto sm:h-10 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${cellClasses}`}
                                id={`calendar_day_${dateStr}`}
                              >
                                <span className="text-xs">{daySlot.dayNum}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-4 border-t border-sand-800/60 flex items-center justify-around text-[10px] text-neutral-400" id="calendar_legends">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full border border-neutral-700 bg-transparent" />
                          <span>Rooms Open</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                          <span>Few Left</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/30 border border-rose-500/40" />
                          <span>Fully Booked</span>
                        </div>
                        {!inventoryKnown && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full border border-sand-800/60 opacity-60" />
                            <span>Not available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Selection Summary & Continue (Right Column) */}
                  <div className="lg:col-span-3 space-y-5" id="selection_summary_panel">
                    <h3 className="font-display font-semibold text-lg text-cream-50">4. Your Selection</h3>

                    <div className="bg-sand-950/80 rounded-2xl p-5 border border-sand-800 space-y-4">
                      {/* Branch + package showcase */}
                      <div>
                        <span className="text-[10px] py-0.5 px-2 rounded-full font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20 inline-block mb-1.5 font-display">
                          CONFIRMED SELECTION
                        </span>
                        <h4 className="font-display font-bold text-cream-50 text-sm leading-snug">{selectedAcc?.name}</h4>
                        <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-gold-500" /> {selectedBranch?.name || 'No branch selected'}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Room seats up to {selectedAcc?.capacity} guest{selectedAcc?.capacity === 1 ? '' : 's'}
                        </div>
                      </div>

                      {/* Appointment date */}
                      <div className="pt-3 border-t border-sand-800/60">
                        <div className="p-3 rounded-xl bg-sand-900 border border-sand-800 text-center">
                          <span className="text-[9px] uppercase font-semibold text-neutral-500 block">APPOINTMENT DATE</span>
                          <span className="text-sm font-display font-medium text-cream-100">
                            {appointmentDate
                              ? new Date(appointmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {!appointmentDate && (
                        <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 p-2.5 border border-amber-500/20 rounded-xl leading-relaxed">
                          <Info className="w-4 h-4 shrink-0 stroke-[2.5]" />
                          <span>Pick a date on the calendar to hold a room at this branch.</span>
                        </div>
                      )}

                      {/* Guests selection counter */}
                      {appointmentDate && (
                        <div className="pt-3 border-t border-sand-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-300">Guests in Room</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setGuests(m => Math.max(1, m - 1))}
                                className="w-7 h-7 rounded-lg border border-sand-800 bg-sand-900 flex items-center justify-center hover:bg-sand-800 text-cream-50"
                                id="btn_decrement_guests"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-display font-semibold text-cream-100 w-4 text-center">{guests}</span>
                              <button
                                type="button"
                                onClick={() => setGuests(m => Math.min(selectedAcc?.capacity || 1, m + 1))}
                                className="w-7 h-7 rounded-lg border border-sand-800 bg-sand-900 flex items-center justify-center hover:bg-sand-800 text-cream-50"
                                id="btn_increment_guests"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {guests === selectedAcc?.capacity && (
                            <p className="text-[10px] text-right text-amber-400">This room seats no more than {selectedAcc.capacity}.</p>
                          )}
                        </div>
                      )}

                      {/* Price Quote Panel */}
                      {sessionsCount > 0 && (
                        <div className="pt-3 border-t border-sand-800/60 space-y-2">
                          <div className="flex justify-between text-xs text-neutral-400 text-left">
                            <span>₱{selectedAcc.price.toLocaleString()} × 1 session</span>
                            <span className="font-display font-medium text-cream-100">₱{basePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-neutral-300 font-semibold pt-1 text-left">
                            <span>Session Subtotal</span>
                            <span className="text-gold-400">₱{basePrice.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={!appointmentDate || !selectedBranchId}
                      onClick={() => setBookingStep(2)}
                      className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-display font-semibold text-sm transition-all shadow-md group ${
                        appointmentDate && selectedBranchId
                          ? 'bg-gold-500 hover:bg-gold-400 text-ink cursor-pointer hover:shadow-gold-500/20 hover:scale-[1.01]'
                          : 'bg-sand-950 text-neutral-600 border border-sand-800 cursor-not-allowed'
                      }`}
                      id="btn_continue_to_step_2"
                    >
                      <span>Proceed to Extras</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CHOOSE ADDONS & GUARANTEE RESERVATION */}
            {bookingStep === 2 && (
              <motion.form 
                onSubmit={handleCreateBooking}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                id="booking_step_2_layout"
              >
                {/* AddOns Choice list (Left 7-columns) */}
                <div className="lg:col-span-7 space-y-6" id="addons_preference_picker">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-cream-50 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold-400" /> Add to Your Treatment
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Optional upgrades your therapist will prepare alongside your session. Skip these if you would rather keep it simple.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addOnsCatalog.map((addon) => {
                      const isPicked = selectedAddOns.some(a => a.id === addon.id);
                      const qty = addOnQuantities[addon.id] || 1;
                      return (
                        <div
                          key={addon.id}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            isPicked 
                              ? 'bg-sand-850 border-gold-500' 
                              : 'bg-sand-950/40 border-sand-800 hover:border-sand-700'
                          }`}
                          id={`addon_card_${addon.id}`}
                        >
                          <div className="space-y-2 cursor-pointer" onClick={() => handleToggleAddOn(addon)}>
                            <div className="flex items-center justify-between">
                              <span className="p-2 bg-sand-900 rounded-xl border border-sand-800 inline-block">
                                {getAddOnIcon(addon.icon)}
                              </span>
                              {isPicked && (
                                <span className="text-[9px] py-0.5 px-2 rounded-full font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20">
                                  ADDED
                                </span>
                              )}
                            </div>
                            <h4 className="font-display font-bold text-sm text-cream-50 leading-snug">{addon.name}</h4>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">{addon.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-sand-800/40 flex items-center justify-between">
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span className="text-xs text-neutral-400 mr-2">Qty:</span>
                              <button
                                type="button"
                                disabled={!isPicked}
                                onClick={() => handleUpdateAddOnQuantity(addon.id, -1)}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                                  isPicked 
                                    ? 'bg-sand-900 border-sand-750 hover:bg-sand-850 text-cream-50 cursor-pointer' 
                                    : 'bg-neutral-900/20 border-neutral-850 text-neutral-600 cursor-not-allowed'
                                }`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className={`text-xs font-bold w-4 text-center ${isPicked ? 'text-cream-100' : 'text-neutral-500'}`}>{qty}</span>
                              <button
                                type="button"
                                disabled={!isPicked}
                                onClick={() => handleUpdateAddOnQuantity(addon.id, 1)}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                                  isPicked 
                                    ? 'bg-sand-900 border-sand-750 hover:bg-sand-850 text-cream-50 cursor-pointer' 
                                    : 'bg-neutral-900/20 border-neutral-850 text-neutral-600 cursor-not-allowed'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-display font-bold text-xs text-gold-300">₱{addon.price}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Customer reservation form */}
                  <div className="bg-sand-950/60 border border-sand-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-display font-semibold text-base text-cream-50">Your Contact Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5 font-display">Full Name</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Juan Dela Cruz"
                          className="w-full bg-sand-900 border border-sand-800 focus:border-gold-500 text-cream-50 px-4 py-3 rounded-xl text-xs outline-none transition-colors"
                          id="input_customer_name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5 font-display">Contact Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="0917XXXXXXX"
                          className="w-full bg-sand-900 border border-sand-800 focus:border-gold-500 text-cream-50 px-4 py-3 rounded-xl text-xs outline-none transition-colors"
                          id="input_customer_phone"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5 font-display">Email Address</label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="juan@gmail.com"
                        className="w-full bg-sand-900 border border-sand-800 focus:border-gold-500 text-cream-50 px-4 py-3 rounded-xl text-xs outline-none transition-colors"
                        id="input_customer_email"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5 font-display">Special Requirements & Meal notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Tell us if you have dietary restrictions, demand heating blankets, or require pet spacing setups..."
                        className="w-full bg-sand-900 border border-sand-800 focus:border-gold-500 text-cream-50 px-4 py-3 rounded-xl text-xs outline-none transition-colors resize-none"
                        id="input_customer_notes"
                      />
                    </div>
                  </div>
                </div>

                {/* billing Checkout Invoice Breakdown (Right 5-columns) */}
                <div className="lg:col-span-5" id="billing_invoice_pane">
                  <div className="bg-sand-950/80 border border-sand-800 rounded-2xl p-6 space-y-5 sticky top-6">
                    <h3 className="font-display font-semibold text-base text-cream-50 border-b border-sand-800 pb-3">
                      Reservation Details
                    </h3>

                    {/* Package summary */}
                    <div className="flex gap-4">
                      {selectedAcc?.imageUrl ? (
                        <img src={selectedAcc.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 border border-sand-800" referrerPolicy="no-referrer" />
                      ) : null}
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-gold-400/80 font-display block">Package</span>
                        <h4 className="font-display font-bold text-sm text-cream-50 leading-snug mt-0.5">{selectedAcc?.name}</h4>
                      </div>
                    </div>

                    {/* Appointment facts */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                      <div className="col-span-2">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 font-display flex items-center gap-1"><Building2 className="w-3 h-3 text-gold-400" /> Branch</span>
                        <span className="text-cream-100 font-medium">{selectedBranch?.name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 font-display flex items-center gap-1"><CalendarCheck className="w-3 h-3 text-gold-400" /> Date</span>
                        <span className="text-cream-100 font-medium">{appointmentDate || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 font-display flex items-center gap-1"><Clock3 className="w-3 h-3 text-gold-400" /> Session</span>
                        <span className="text-cream-100 font-medium">{sessionsCount} session</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 font-display flex items-center gap-1"><Users className="w-3 h-3 text-gold-400" /> Guests</span>
                        <span className="text-cream-100 font-medium">{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                      </div>
                    </div>

                    {/* Itemised prices */}
                    <div className="space-y-3 pt-4 border-t border-sand-800">
                      <div className="flex justify-between text-xs text-left">
                        <span className="text-neutral-400">Session rate (1 session)</span>
                        <span className="font-display font-semibold text-neutral-200">₱{basePrice.toLocaleString()}</span>
                      </div>
                      
                      {selectedAddOns.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-display block">ADD-ONS</span>
                          {selectedAddOns.map(addon => {
                            const qty = addOnQuantities[addon.id] || 1;
                            return (
                              <div key={addon.id} className="flex justify-between text-xs pl-2 border-l border-gold-500/20 text-left">
                                <span className="text-neutral-400">{addon.name} (×{qty})</span>
                                <span className="font-display text-neutral-300">₱{(addon.price * qty).toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex justify-between text-xs pt-3 border-t border-sand-800 select-total-lines text-left">
                        <span className="text-neutral-300 font-medium">Total Appointment Cost</span>
                        <span className="font-display font-bold text-neutral-100">₱{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Amount to pay */}
                    <div className="bg-sand-900 p-4 rounded-xl border border-gold-500/20 flex justify-between items-center text-left">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gold-400 block font-display">Amount to Pay</span>
                        <span className="text-[10px] text-neutral-500 block">Full payment via bank transfer or e-wallet</span>
                      </div>
                      <span className="font-display font-bold text-xl text-gold-400">₱{grandTotal.toLocaleString()}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/15 leading-relaxed text-[11px] text-emerald-200 text-left">
                        <Info className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>On the next step you'll get a reservation ticket with the payment account details and QR codes. Your room is held for you; the appointment is confirmed once staff verify your payment.</span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setBookingStep(1)}
                          className="flex-1 py-3 px-4 rounded-xl border border-sand-800 bg-sand-900 hover:bg-sand-800 text-neutral-300 font-display font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Change Selection
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-3 py-3 px-6 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink font-display font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-sand-950 border-t-transparent rounded-full animate-spin" />
                              <span>Reserving your room...</span>
                            </>
                          ) : (
                            <>
                              <span>Confirm Appointment &amp; Get Ticket</span>
                              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.form>
            )}

            {/* STEP 3: RESERVATION TICKET + PAYMENT INSTRUCTIONS */}
            {bookingStep === 3 && newBookingResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto py-4"
                id="booking_step_3_ticket"
              >
                <div className="bg-paper-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#c9a054]/30 text-ink relative">
                  <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-ink -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-ink -translate-y-1/2" />

                  {/* Header */}
                  <div className="bg-ink text-paper-50 p-6 flex justify-between items-center border-b border-[#c9a054]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-[#e0bb73] flex items-center justify-center bg-ink shrink-0">
                        <span className="font-serif font-bold text-xs text-[#e0bb73]">SI</span>
                      </div>
                      <div>
                        <h4 className="font-serif font-extrabold text-sm tracking-wide text-[#e0bb73]">SPA DE ILOKO</h4>
                        <span className="text-[10px] text-ink-500 flex items-center gap-0.5 uppercase tracking-widest font-bold font-display"><MapPin className="w-3 h-3 text-[#8a6520]" /> {newBookingResult.branchName || 'Branch'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Reference Code</span>
                      <span className="font-display font-bold text-base text-[#e0bb73]">{newBookingResult.reference}</span>
                    </div>
                  </div>

                  {/* Status banner */}
                  <div className="p-6 text-center border-b border-ink/10 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                      <CalendarCheck className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-ink">Appointment Held — Awaiting Payment</h3>
                    <p className="text-xs text-ink-700 max-w-md mx-auto">
                      Thanks, <span className="font-bold">{newBookingResult.customerName}</span>. Your treatment room is held. Send your payment using the details below, then email your proof of payment — your appointment is confirmed once we verify it.
                    </p>
                  </div>

                  {/* Receipt: guest + reservation */}
                  <div className="p-6 border-b border-dashed border-ink/20 bg-paper-50 space-y-5 text-left">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-[#7a5a18] font-display block mb-1.5">Client Details</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Name</span>
                          <span className="font-semibold text-ink">{newBookingResult.customerName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Email</span>
                          <span className="font-semibold text-ink break-all">{newBookingResult.customerEmail}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Phone</span>
                          <span className="font-semibold text-ink">{newBookingResult.customerPhone || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-[#7a5a18] font-display block mb-1.5">Appointment</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Reference No.</span>
                          <span className="font-mono font-bold text-ink">{newBookingResult.reference}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Branch</span>
                          <span className="font-semibold text-ink">{newBookingResult.branchName || '—'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Package</span>
                          <span className="font-semibold text-ink">{newBookingResult.accommodationName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Appointment Date</span>
                          <span className="font-semibold text-ink">{newBookingResult.checkIn}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Branch Address</span>
                          <span className="font-semibold text-ink">{newBookingResult.branchAddress || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Guests</span>
                          <span className="font-semibold text-ink">{newBookingResult.guestsCount} pax</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Costs */}
                  <div className="p-6 space-y-3 border-b border-ink/10">
                    <div className="flex justify-between text-xs text-ink-700">
                      <span>Session ({newBookingResult.accommodationName})</span>
                      <span>₱{Number(
                        Number(newBookingResult.totalAmount) -
                        (Array.isArray(newBookingResult.addOns) ? newBookingResult.addOns.reduce((s: number, a: any) => s + a.price * a.quantity, 0) : 0)
                      ).toLocaleString()}</span>
                    </div>
                    {Array.isArray(newBookingResult.addOns) && newBookingResult.addOns.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-ink-500 block font-display">Add-ons</span>
                        {newBookingResult.addOns.map((a: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-ink-700">
                            <span>{a.name} ×{a.quantity}</span>
                            <span>₱{(a.price * a.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-ink/10">
                      <span className="text-sm font-bold text-ink">Total Amount</span>
                      <span className="font-display font-black text-xl text-emerald-800">₱{Number(newBookingResult.amountDue ?? newBookingResult.totalAmount).toLocaleString()}</span>
                    </div>
                    {newBookingResult.notes && (
                      <div className="p-3 bg-ink/5 rounded-xl border border-ink/10 text-[11px] text-ink-700 italic">
                        <span className="font-bold uppercase text-[9px] text-ink-500 block font-display not-italic">Your request:</span>
                        "{newBookingResult.notes}"
                      </div>
                    )}
                  </div>

                  {/* Email confirmation note */}
                  <div className="px-6 py-4 bg-emerald-500/5 border-b border-ink/10 flex items-start gap-2.5 text-[11px] text-emerald-900 leading-relaxed">
                    <Info className="w-4 h-4 shrink-0 text-emerald-600 mt-px" />
                    <span>A confirmation will be sent to <span className="font-semibold break-all">{newBookingResult.customerEmail}</span>. If you don't see it shortly, please check your spam / junk folder.</span>
                  </div>

                  {/* Payment instructions */}
                  {newBookingResult.paymentInstructions && (
                    <div className="p-6 space-y-4 bg-paper-50">
                      <h4 className="font-serif font-bold text-base text-ink">{newBookingResult.paymentInstructions.headline}</h4>

                      <div className="space-y-3">
                        {(newBookingResult.paymentInstructions.accounts || [])
                          .filter((acc: any) => acc.accountName || acc.accountNumber || acc.qrImageUrl)
                          .map((acc: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-ink/10 bg-white">
                            {acc.qrImageUrl ? (
                              <img src={acc.qrImageUrl} alt={`${acc.method} QR`} className="w-20 h-20 rounded-lg object-contain shrink-0 border border-ink/10" />
                            ) : null}
                            <div className="min-w-0">
                              <span className="font-display font-bold text-xs uppercase tracking-wide text-[#7a5a18] block">{acc.method}</span>
                              <span className="text-sm font-semibold text-ink block">{acc.accountName}</span>
                              <span className="text-sm font-mono text-ink-700 block break-all">{acc.accountNumber}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 leading-relaxed">
                        {newBookingResult.paymentInstructions.note}
                      </div>

                      <div className="text-xs text-ink">
                        <span className="font-bold">Send your proof of payment to: </span>
                        <a href={`mailto:${newBookingResult.paymentInstructions.proofEmail}?subject=Proof of payment ${newBookingResult.reference}`} className="font-mono text-emerald-800 underline break-all">
                          {newBookingResult.paymentInstructions.proofEmail}
                        </a>
                        <span className="block text-ink-500 mt-0.5">Include your reference code <span className="font-mono font-bold">{newBookingResult.reference}</span>.</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-ink/5 px-6 py-4 flex items-center justify-between border-t border-ink/10">
                    <span className="text-[8px] font-mono text-ink-500 tracking-widest uppercase">SDI-APPOINTMENT-HELD</span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2 px-3.5 rounded-xl bg-ink text-paper-50 hover:bg-ink font-display font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Save Ticket
                    </button>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <button
                    onClick={() => {
                      setAppointmentDate('');
                      setSelectedAddOns([]);
                      setNotes('');
                      setCustomerName('');
                      setCustomerPhone('');
                      setCustomerEmail('');
                      setAddOnQuantities({});
                      setNewBookingResult(null);
                      setBookingStep(1);
                    }}
                    className="py-3 px-6 rounded-2xl bg-ink-700 text-paper-50 hover:bg-ink-700 transition-colors text-xs font-display font-semibold cursor-pointer"
                  >
                    Book Another Appointment
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        )}

        {/* --- VERIFY & MANAGE EXISTING RESERVATIONS TAB --- */}
        {activeSubTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto py-4 space-y-6"
            id="manage_tab_node"
          >
            <div className="space-y-2 text-center">
              <h3 className="font-display font-semibold text-xl text-cream-50">Check Your Appointment</h3>
              <p className="text-xs text-neutral-400">Look up an existing booking by its reference code to see its status, payment details, or release an unpaid hold.</p>
            </div>

            <form onSubmit={handleSearchBooking} className="flex gap-2 max-w-md mx-auto" id="manage_search_form">
              <input
                type="text"
                value={searchBookingRef}
                onChange={(e) => setSearchBookingRef(e.target.value)}
                placeholder="Ex: SDI-8429, SDI-1123..."
                className="flex-1 bg-sand-950 border border-sand-800 focus:border-gold-500 text-cream-50 px-4 py-3 rounded-xl text-xs outline-none transition-colors"
                id="search_booking_input"
              />
              <button
                type="submit"
                className="py-3 px-6 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink font-display font-bold text-xs transition-colors"
                id="search_booking_button"
              >
                Search Record
              </button>
            </form>

            {searchError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center justify-center gap-2 text-xs max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Display queried booking cards */}
            <AnimatePresence mode="wait">
              {searchedBooking && (
                <motion.div
                  key={searchedBooking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-sand-950/80 rounded-2xl border border-sand-800 p-6 space-y-5 text-left"
                  id={`query_result_${searchedBooking.id}`}
                >
                  <div className="flex justify-between items-start border-b border-sand-800 pb-4">
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-neutral-500 leading-none">BOOKED BY</span>
                      <h4 className="font-display font-bold text-cream-50 mt-1">{searchedBooking.customerName}</h4>
                      <p className="text-[10px] text-neutral-400 mt-1">{searchedBooking.customerEmail} | {searchedBooking.customerPhone}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block font-display">STATUS CODE</span>
                      <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full inline-block mt-1 ${
                        searchedBooking.status === 'confirmed'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : searchedBooking.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {searchedBooking.status === 'pending' ? 'AWAITING PAYMENT' : searchedBooking.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Branch</span>
                      <span className="font-medium text-cream-200">
                        {(searchedBooking as any).branchName
                          || branches.find(b => b.id === searchedBooking.branchId)?.name
                          || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Package</span>
                      <span className="font-medium text-cream-200">{accommodations.find(a => a.id === searchedBooking.accommodationId)?.name || 'Spa package'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Appointment date</span>
                      <span className="font-medium text-cream-200">{searchedBooking.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Total cost</span>
                      <span className="font-display font-bold text-gold-400">₱{searchedBooking.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="py-2 text-xs border-t border-sand-800/60">
                    <span className="text-[10px] text-neutral-500 block">Payment</span>
                    <span className={`font-display font-semibold ${(searchedBooking as any).paymentStatus === 'completed' ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {(searchedBooking as any).paymentStatus === 'completed' ? 'Verified / received' : 'Awaiting payment verification'}
                    </span>
                  </div>

                  {searchedBooking.status === 'pending' && (
                    <div className="flex justify-end gap-3 pt-3 border-t border-sand-800/60" id="query_actions">
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(searchedBooking.id)}
                        className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-display font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Release Unpaid Hold
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Guidance */}
            <div className="bg-sand-900/50 p-4 rounded-2xl border border-sand-800 max-w-md mx-auto text-center text-xs space-y-2 text-neutral-400">
              <span className="font-display font-bold text-gold-500 text-xs flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5" /> Your Reference Code
              </span>
              <p className="leading-relaxed text-[11px]">
                Enter the <span className="font-mono bg-sand-950 px-1.5 py-0.5 rounded text-amber-300 font-bold">SDI-XXXXXX</span> code from your reservation ticket to view its status and payment details.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
