import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, BookOpen, Warehouse, HeartHandshake, ShieldAlert } from 'lucide-react';
import { FAQ } from '../types';

interface FAQsSectionProps {
  faqs: FAQ[];
}

export default function FAQsSection({ faqs }: FAQsSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqs.length > 0 ? faqs[0].id : null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Queries', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'booking', name: 'Rates & Arrival', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'stay', name: 'Weather & Gear', icon: <Warehouse className="w-3.5 h-3.5" /> },
    { id: 'amenities', name: 'Connectivity', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
    { id: 'policies', name: 'Rules & Policies', icon: <ShieldAlert className="w-3.5 h-3.5" /> }
  ];

  const filteredFAQs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter((faq: FAQ) => faq.category === activeCategory);

  const toggleFAQ = (id: string) => {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
    }
  };

  return (
    <section id="faqs" className="py-24 bg-pine-900 border-t border-pine-850 text-cream-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase font-extrabold tracking-widest text-gold-400 font-display block">
            COMMON INQUIRIES
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-cream-100">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Need directions on Baguio commutes or advice on wool sweaters? Browse our organized mountain handbooks to set up your expectations.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Categories Sidebar (Left 4-columns) */}
          <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-28" id="faqs_sidebar_node">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-neutral-400 pl-3 text-left">
              Help Categories
            </h3>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none" id="faqs_category_buttons">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setOpenId(null); }}
                    className={`py-3 px-4 rounded-xl font-display font-medium text-xs transition-all flex items-center gap-2.5 shrink-0 text-left w-auto lg:w-full ${
                      isActive
                        ? 'bg-gold-500 text-pine-950 font-bold shadow-lg shadow-gold-500/10'
                        : 'bg-pine-950/40 border border-pine-850/60 hover:border-pine-700 text-neutral-300'
                    }`}
                  >
                    <span className={isActive ? 'text-pine-950' : 'text-gold-500'}>
                      {cat.icon}
                    </span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accordion list (Right 8-columns) */}
          <div className="lg:col-span-8 space-y-3" id="faqs_accordions_list">
            {faqs.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredFAQs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <motion.div
                      key={faq.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-pine-950/40 border border-pine-850/60 rounded-2xl overflow-hidden transition-all duration-300"
                      id={`faq_accordion_${faq.id}`}
                    >
                      {/* Header trigger */}
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full py-4.5 px-5 flex items-center justify-between text-left hover:bg-pine-950/80 transition-colors gap-3"
                        aria-expanded={isOpen}
                      >
                        <span className="font-display font-semibold text-xs sm:text-sm text-cream-100 pr-4">
                          {faq.question}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gold-400 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-gold-500' : ''}`} />
                      </button>

                      {/* Expandable answer */}
                      {isOpen && (
                        <div className="border-t border-pine-850/50 bg-pine-950/20 p-5 text-left text-xs leading-relaxed text-neutral-300">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="py-12 border border-dashed border-pine-850 rounded-2xl text-center text-neutral-500 text-xs flex flex-col items-center justify-center p-6 space-y-2">
                <HelpCircle className="w-6 h-6 text-neutral-700 animate-pulse" />
                <span>No FAQ entries added by the administrator yet.</span>
                <span className="text-[10px] text-neutral-600">Populate standard FAQs instantly by seeding demo content inside the Admin Panel.</span>
              </div>
            )}

            {faqs.length > 0 && filteredFAQs.length === 0 && (
              <div className="py-12 border border-dashed border-pine-850 rounded-2xl text-center text-neutral-400 text-xs">
                No items found for the selected category.
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
