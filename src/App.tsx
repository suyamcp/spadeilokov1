/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  MapPin,
  ArrowDown,
  Phone,
  Clock3,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import Navigation from './components/Navigation';
import BookingSystem from './components/BookingSystem';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import FAQsSection from './components/FAQsSection';
import AdminPanel from './components/AdminPanel';
import CookieConsent from './components/CookieConsent';
import { getCMSData, CMSData, saveCMSData } from './lib/cmsState';
import { Booking } from './types';

/** Badge label for each package grade, shown on the rate cards. */
const PACKAGE_LABEL: Record<string, string> = {
  signature_suite: 'Signature Suite',
  deluxe_room: 'Deluxe Room',
  classic_room: 'Classic Room',
};

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [preselectedRoomId, setPreselectedRoomId] = useState<string>('signature-suite');
  const [preselectedBranchId, setPreselectedBranchId] = useState<string>('');
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // --- NEW TWO-SYSTEM STATES ---
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [cmsData, setCmsData] = useState<CMSData>(getCMSData());
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load CMS data from server
  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(dbContent => {
        const local = getCMSData();
        const merged: CMSData = {
          hero: dbContent.hero || local.hero,
          about: dbContent.about || local.about,
          branches: (dbContent.branches && dbContent.branches.length > 0) ? dbContent.branches : local.branches,
          accommodations: (dbContent.accommodations && dbContent.accommodations.length > 0) ? dbContent.accommodations : local.accommodations,
          services: (dbContent.services && dbContent.services.length > 0) ? dbContent.services : local.services,
          faqs: dbContent.faqs || local.faqs
        };
        setCmsData(merged);
        saveCMSData(merged);
      })
      .catch(err => {
        console.error('Failed to load CMS content from server, using local fallback:', err);
      });
  }, []);

  // Load bookings from the server. Admins (with a session token) get full records;
  // everyone else gets the no-PII availability feed used to draw the calendar.
  const refreshBookings = useCallback(() => {
    const token = sessionStorage.getItem('sdi_admin_token');
    if (token) {
      fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => {
          // A stale token used to fail silently and leave the panel looking empty.
          // Drop it and tell the admin panel to ask for a fresh login instead.
          if (res.status === 401) {
            sessionStorage.removeItem('sdi_admin_token');
            window.dispatchEvent(new Event('sdi-admin-session-expired'));
            throw new Error('Admin session expired');
          }
          if (!res.ok) throw new Error('Failed to load bookings');
          return res.json();
        })
        .then(data => { if (Array.isArray(data)) setBookings(data); })
        .catch(err => console.error('Error loading admin bookings:', err));
    } else {
      fetch('/api/availability')
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          setBookings(data.map((row: any, index: number) => ({
            id: `avail-${index}`,
            branchId: row.branch || '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            checkIn: row.checkIn,
            checkOut: row.checkOut,
            accommodationId: row.roomTypeSlug,
            guestsCount: 0,
            totalAmount: 0,
            addOns: [],
            status: row.status,
            createdAt: '',
          })));
        })
        .catch(err => console.error('Error loading public availability:', err));
    }
  }, []);

  useEffect(() => {
    // Drop any stale demo bookings a previous build cached in the browser.
    try { localStorage.removeItem('sdi_bookings'); } catch { /* noop */ }
    refreshBookings();
  }, [showAdmin, refreshBookings]);

  // Sync scroll position to highlight navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'rates', 'services', 'branches', 'faqs', 'booking_portal_section'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookRoom = (roomId: string) => {
    setPreselectedRoomId(roomId);

    // Smooth scroll down to booking section
    const target = document.getElementById('booking_portal_section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }

    const selectedPkg = cmsData.accommodations.find(a => a.id === roomId);
    const roomName = selectedPkg?.name || 'Your selected package';
    triggerCustomToast(`Pre-selected "${roomName}". Calendar updated!`);
  };

  const handleBookBranch = (branchId: string) => {
    setPreselectedBranchId(branchId);
    const target = document.getElementById('booking_portal_section');
    if (target) target.scrollIntoView({ behavior: 'smooth' });

    const branch = cmsData.branches.find(b => b.id === branchId);
    triggerCustomToast(`Booking at ${branch?.name || 'the selected branch'}.`);
  };

  const triggerCustomToast = (msg: string) => {
    setNotificationMsg(msg);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4500);
  };

  const handleScrollToBooking = () => {
    const target = document.getElementById('booking_portal_section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpdateBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
  };

  const namedBranches = cmsData.branches.filter(b => b.name);

  return (
    <div className="min-h-screen bg-sand-950 text-cream-50 font-sans selection:bg-gold-500 selection:text-ink antialiased overflow-x-hidden">

      <CookieConsent />

      {/* Toast Notification HUD */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-xl bg-gold-500 text-ink font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-gold-500/20 border border-gold-300"
            id="toast_notification_hud"
          >
            <Sparkles className="w-4 h-4 text-ink" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==============================================
          1. ADMIN CONTROL SYSTEM PANEL
          ============================================== */}
      {showAdmin ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[85vh] animate-fadeIn">
          <AdminPanel
            currentData={cmsData}
            onDataChange={(newData) => setCmsData(newData)}
            bookings={bookings}
            onBookingsChange={handleUpdateBookings}
            onRefreshBookings={refreshBookings}
            onClose={() => setShowAdmin(false)}
          />
        </main>
      ) : (
        /* ==============================================
            2. CUSTOMER FRONT-FACING PUBLIC SYSTEM
            ============================================== */
        <div className="animate-fadeIn">

          {/* Main navigation header */}
          <Navigation
            onBookNowClick={handleScrollToBooking}
            activeSection={activeSection}
            onAdminClick={() => {
              setShowAdmin(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* --- HERO PORTRAIT SECTION ---
              The hero always sits on a dark scrim, in either theme, so the light
              type over the photo stays readable on the light-brown page. */}
          <header className="relative min-h-[90vh] flex flex-col justify-between items-center text-center overflow-hidden bg-[#241a10]" id="spa_hero_billboard">
            <div className="absolute inset-0 z-0">
              {cmsData.hero.backgroundImage ? (
                <img
                  src={cmsData.hero.backgroundImage}
                  alt="Spa de Iloko treatment room"
                  className="w-full h-full object-cover brightness-[0.42]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2c1f13] via-[#3a2a1a] to-[#241a10] flex items-center justify-center p-6">
                  {/* Elegant solid pattern fallback displaying a subtle structural wireframe layout */}
                  <div className="border border-dashed border-white/20 rounded-3xl p-8 max-w-lg text-center text-white/50 space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-white/40 animate-pulse" />
                    <span className="font-display font-black text-xs uppercase tracking-widest text-white/60 block">Cover Image Placeholder</span>
                    <p className="text-[10px] text-white/40">This area will display your big backdrop image. Upload custom image links inside the Admin Control Panel.</p>
                  </div>
                </div>
              )}
              {/* Warm vignette so the type never fights the photo */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#241a10]/70 via-[#241a10]/25 to-[#241a10]" />
            </div>

            {/* Floating brand credits */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex justify-between sm:justify-end z-10" id="hero_upper_credits">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#e0bb73]/90 block font-display">
                  EST. 2014 — NORTHERN LUZON
                </span>
                <span className="text-[8px] tracking-[0.15em] text-paper-50/60 block font-mono mt-0.5">
                  {namedBranches.length || 6} BRANCHES · OPEN DAILY
                </span>
              </div>
            </div>

            {/* Core display message with the pulsing pill BOOK NOW button */}
            <div className="max-w-4xl mx-auto px-4 z-10 py-16 sm:py-24 flex flex-col items-center justify-center space-y-8 animate-fadeIn" id="hero_title_cta_group">

              <div className="space-y-4">
                {/* Elegant subheader tagline */}
                <span className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#e0bb73] block font-display bg-white/5 py-1.5 px-4 rounded-full border border-[#e0bb73]/20 backdrop-blur w-fit mx-auto">
                  {cmsData.hero.tagline || "[BRAND TAGLINE PLACEHOLDER]"}
                </span>

                <h1 className="font-serif font-black text-4xl sm:text-6xl text-paper-50 leading-tight tracking-tight pt-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                  {cmsData.hero.title || "[SPA DE ILOKO TITLE PLACEHOLDER]"}
                </h1>

                <p className="text-sm sm:text-base text-paper-50/85 max-w-2xl mx-auto leading-relaxed font-light min-h-[30px] drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
                  {cmsData.hero.description || "[This is a placeholder for your spa introduction paragraph. To customize this text, click on \"Open Admin Panel\" in the system toggle bar at the top of your screen.]"}
                </p>
              </div>

              {/* PULSING PILL BOOK NOW BUTTON */}
              <button
                onClick={handleScrollToBooking}
                className="neon-btn-glow py-4 px-10 rounded-full bg-black/60 backdrop-blur-sm border-2 border-[#c19549] hover:border-[#e0bb73] hover:bg-[#c19549] text-paper-50 hover:text-ink font-display font-extrabold text-sm tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl relative group cursor-pointer"
                id="hero_pill_book_now_btn"
              >
                <span className="relative z-10 flex items-center gap-3">
                  BOOK NOW <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>

            {/* Ambient indicator bar at footer */}
            <div className="z-10 pb-8 flex flex-col items-center gap-1.5 cursor-pointer animate-bounce text-paper-50/70 hover:text-[#e0bb73]" onClick={handleScrollToBooking} id="arrow_indicator">
              <span className="text-[9px] uppercase font-bold tracking-widest font-display">Discover Our Treatments</span>
              <ArrowDown className="w-4 h-4" />
            </div>
          </header>

          {/* --- PACKAGES & RATES SECTION ('Packages' link) --- */}
          <section id="rates" className="py-24 bg-sand-950 text-cream-50 border-t border-sand-900/60 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              <div className="text-left max-w-3xl mb-16 space-y-4">
                <span className="text-xs uppercase font-extrabold tracking-widest text-gold-400 font-display block">
                  SPA PACKAGES
                </span>
                <h2 className="font-serif font-black text-3xl sm:text-4xl text-cream-100 leading-tight">
                  Packages &amp; Session Rates
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
                  Three room grades, the same rates at every branch. From a private couple's suite to the everyday
                  hilot our regulars come back for — pick a package, then choose the branch and date that suit you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="rates_showcase_grid">
                {cmsData.accommodations.map((room) => (
                  <div
                    key={room.id}
                    className="bg-sand-900/60 border border-sand-850 hover:border-gold-500/40 rounded-3xl overflow-hidden transition-all flex flex-col justify-between group"
                    id={`room_card_${room.id}`}
                  >
                    <div>
                      {/* Aspect ratio frame for package image */}
                      <div className="aspect-[4/3] w-full overflow-hidden relative border-b border-sand-850">
                        {room.imageUrl ? (
                          <img
                            src={room.imageUrl}
                            alt={room.name || 'Spa package'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full border border-dashed border-sand-800 flex flex-col items-center justify-center bg-sand-950/40 text-neutral-500 text-xs gap-1.5 p-4 text-center">
                            <ImageIcon className="w-6 h-6 text-neutral-600 animate-pulse" />
                            <span className="font-display font-black text-[10px] tracking-widest uppercase text-neutral-500">Package Image Placeholder</span>
                            <span className="text-[9px] text-neutral-600">Configure cover in Admin Panel</span>
                          </div>
                        )}
                        <div className="img-fade absolute inset-0 bg-gradient-to-t from-sand-950 via-sand-950/20 to-transparent" />

                        {/* Float tags */}
                        <span className="absolute top-4 right-4 py-1 px-2.5 rounded-lg bg-sand-950/95 backdrop-blur border border-sand-800 text-[9px] font-bold text-gold-400 tracking-wider uppercase font-display">
                          {PACKAGE_LABEL[room.type] || 'Treatment Room'}
                        </span>
                      </div>

                      {/* Body Specs */}
                      <div className="p-6 space-y-4 text-left">
                        <div className="space-y-1.5">
                          <h3 className="font-display font-bold text-base text-cream-100 group-hover:text-gold-400 transition-colors">
                            {room.name || "[Package Title Placeholder]"}
                          </h3>
                          <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gold-500" /> Up to {room.capacity || '--'} pax
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                            <span>{room.quantity || '0'} rooms per branch</span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed min-h-[54px]">
                          {room.description || "[This is a placeholder for your package description. Detail the treatment length, the oils used, the room setup, and what is included inside the Admin Panel.]"}
                        </p>

                        {/* Features checklist */}
                        <div className="space-y-1.5 pt-2 border-t border-sand-850/60">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 font-display block">WHAT'S INCLUDED</span>
                          <div className="grid grid-cols-1 gap-1">
                            {room.features && room.features.length > 0 ? (
                              room.features.slice(0, 4).map((f, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-2 text-[10.5px] text-neutral-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500/80 shrink-0" />
                                  <span className="truncate">{f}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-[10px] text-neutral-600 italic">No inclusions specified. Configure features in Admin.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card footer details & button trigger layout */}
                    <div className="p-6 border-t border-sand-850/60 flex items-center justify-between gap-4">
                      <div className="text-left">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block font-display">SESSION RATE</span>
                        <span className="font-display font-bold text-base text-gold-400">
                          {room.price ? `₱${room.price.toLocaleString()}` : "₱ --"} <span className="text-[10px] text-neutral-400 font-light">/ session</span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleBookRoom(room.id)}
                        className="py-2.5 px-4 rounded-xl bg-gold-500/15 hover:bg-gold-500 border border-gold-500/30 text-gold-400 hover:text-ink font-display font-bold text-xs transition-all tracking-wider flex items-center gap-1 cursor-pointer select-none"
                        id={`btn_book_room_${room.id}`}
                      >
                        <span>Book This</span>
                        <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </section>

          {/* --- ABOUT STORY SECTION --- */}
          <AboutSection data={cmsData.about} />

          {/* --- SERVICES SECTION --- */}
          <ServicesSection services={cmsData.services} />

          {/* --- BRANCH DIRECTORY --- */}
          <section id="branches" className="py-24 bg-sand-900 border-t border-sand-850 text-cream-50 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <span className="text-xs uppercase font-extrabold tracking-widest text-gold-400 font-display block">
                  OUR LOCATIONS
                </span>
                <h2 className="font-serif font-bold text-3xl sm:text-4xl text-cream-100">
                  Find the Branch Nearest You
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Every branch runs the same treatments at the same rates, with its own set of treatment rooms.
                  Choose your branch when you book and the calendar will show only that location's availability.
                </p>
              </div>

              {namedBranches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="branches_grid">
                  {namedBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="bg-sand-950/60 border border-sand-850 hover:border-gold-500/40 rounded-2xl p-6 text-left flex flex-col justify-between gap-5 transition-all group"
                      id={`branch_card_${branch.id}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display font-bold text-sm text-cream-100 group-hover:text-gold-400 transition-colors">
                            {branch.name}
                          </h3>
                          <span className="text-[9px] uppercase font-black tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/20 py-1 px-2 rounded-lg font-display shrink-0">
                            {branch.city}
                          </span>
                        </div>

                        <ul className="space-y-2 text-[11px] text-neutral-400">
                          <li className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0 mt-0.5" />
                            <span>{branch.address}</span>
                          </li>
                          {branch.phone && (
                            <li className="flex items-start gap-2">
                              <Phone className="w-3.5 h-3.5 text-gold-500 shrink-0 mt-0.5" />
                              <span>{branch.phone}</span>
                            </li>
                          )}
                          {branch.hours && (
                            <li className="flex items-start gap-2">
                              <Clock3 className="w-3.5 h-3.5 text-gold-500 shrink-0 mt-0.5" />
                              <span>{branch.hours}</span>
                            </li>
                          )}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleBookBranch(branch.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gold-500/15 hover:bg-gold-500 border border-gold-500/30 text-gold-400 hover:text-ink font-display font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        id={`btn_book_branch_${branch.id}`}
                      >
                        <span>Book at this branch</span>
                        <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 border border-dashed border-sand-850 rounded-3xl text-center text-neutral-500 text-xs flex flex-col items-center justify-center space-y-2">
                  <MapPin className="w-6 h-6 text-neutral-600 animate-pulse" />
                  <span>No branches configured yet.</span>
                  <span className="text-[10px] text-neutral-600">Add your locations under Admin Panel → Branch Directory.</span>
                </div>
              )}

            </div>
          </section>

          {/* --- FULL BOOKING ENGINE HUD --- */}
          <section id="booking_portal_section" className="py-24 bg-sand-950 border-t border-b border-sand-850 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <span className="text-xs uppercase font-extrabold tracking-widest text-gold-400 font-display flex items-center justify-center gap-2">
                  <CalendarDays className="w-4 h-4 animate-pulse" /> YOUR ROOM, HELD FOR YOU
                </span>
                <h2 className="font-serif font-black text-3xl sm:text-4xl text-cream-100">
                  Live Availability Calendar
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Check real-time treatment room availability at any of our branches. Your room is held the moment
                  your reservation ticket is generated.
                </p>
              </div>

              {/* Master interactive live booking widget */}
              <BookingSystem
                initialAccommodationId={preselectedRoomId}
                initialBranchId={preselectedBranchId}
                branches={cmsData.branches}
                accommodations={cmsData.accommodations}
                bookings={bookings}
                onBookingsChange={handleUpdateBookings}
                onBookingSuccess={() => { triggerCustomToast('Appointment reserved — check your ticket below.'); refreshBookings(); }}
              />

            </div>
          </section>

          {/* --- FAQS SECTION --- */}
          <FAQsSection faqs={cmsData.faqs} />

          {/* --- SITE FOOTER --- */}
          <footer className="bg-sand-900 border-t border-sand-850 text-neutral-400 py-16 text-xs" id="website_footer_node">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left pb-12 border-b border-sand-850" id="footer_links_grid">

                {/* Col 1: Brand details */}
                <div className="space-y-4 md:col-span-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-paper-50 border border-gold-500 overflow-hidden flex items-center justify-center p-0.5">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="#fdfaf4" />
                        <path d="M50 22 C64 26 72 38 68 52 C56 52 47 42 50 22 Z" fill="#2c6647" />
                        <circle cx="62" cy="68" r="5" fill="#c19549" />
                      </svg>
                    </div>
                    <span className="font-serif font-extrabold text-cream-100 text-sm tracking-wide">Spa de Iloko</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Traditional Ilocano hilot and modern bodywork, in warm and quiet treatment rooms.
                    Relax, refresh, rejuvenate — since 2014.
                  </p>
                </div>

                {/* Col 2: Branch list */}
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-xs text-cream-100 uppercase tracking-wider">Our Branches</h4>
                  <ul className="space-y-1.5 text-[11px]">
                    {namedBranches.length > 0 ? (
                      namedBranches.map(b => (
                        <li key={b.id}>
                          <a href="#branches" className="hover:text-gold-400">{b.name}</a>
                        </li>
                      ))
                    ) : (
                      <li className="text-neutral-600 italic">Configure branches in the Admin Panel.</li>
                    )}
                  </ul>
                </div>

                {/* Col 3: Fast navigation */}
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-xs text-cream-100 uppercase tracking-wider">Fast Navigation</h4>
                  <ul className="space-y-1.5 text-[11px]">
                    <li><a href="#about" className="hover:text-gold-400">Our story &amp; standards</a></li>
                    <li><a href="#rates" className="hover:text-gold-400">Packages &amp; session rates</a></li>
                    <li><a href="#services" className="hover:text-gold-400">Treatments &amp; services</a></li>
                    <li><a href="#branches" className="hover:text-gold-400">Branch directory</a></li>
                    <li><a href="#faqs" className="hover:text-gold-400">Booking &amp; policies</a></li>
                  </ul>
                </div>

                {/* Col 4: Hours & contact */}
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-xs text-cream-100 uppercase tracking-wider">Hours &amp; Contact</h4>
                  <ul className="space-y-1.5 text-[11px] text-neutral-500">
                    <li><span className="text-neutral-300 font-semibold">Open Daily:</span> {cmsData.about.openingHours || '10:00 AM — 10:00 PM'}</li>
                    <li><span className="text-neutral-300 font-semibold">Booking Hotline:</span> {cmsData.about.hotline || '+63 917 000 0001'}</li>
                    <li><span className="text-neutral-300 font-semibold">Last Booking:</span> One hour before closing</li>
                  </ul>
                </div>

              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-neutral-600 font-display font-semibold" id="footer_trademark_bar">
                <span>© 2026 SPA DE ILOKO. ALL RIGHTS RESERVED.</span>
                <div className="flex flex-wrap items-center gap-4">
                  <a href="#faqs" className="hover:text-neutral-400 uppercase">Privacy Policy</a>
                  <span>•</span>
                  <a href="#faqs" className="hover:text-neutral-400 uppercase">Term of Service</a>
                  <span>•</span>
                  <button
                    onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                    className="hover:text-neutral-400 uppercase tracking-wider cursor-pointer"
                  >
                    Cookie Settings
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => {
                      setShowAdmin(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-1 text-neutral-600 hover:text-gold-400"
                  >
                    <Lock className="w-3 h-3 text-gold-500" />
                    <span>Admin Panel</span>
                  </button>
                  <span>•</span>
                  <span className="text-neutral-500 font-mono">APP-VERSION: 1.1.0-STABLE</span>
                </div>
              </div>
            </div>
          </footer>

        </div>
      )}

    </div>
  );
}
