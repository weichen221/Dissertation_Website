/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Compass, 
  Activity, 
  History, 
  Award, 
  Eye, 
  Cpu, 
  Volume2, 
  Users, 
  BookOpen,
  Menu,
  X,
  MapPin,
  ExternalLink,
  Mail,
  ClipboardList
} from 'lucide-react';

interface SidebarNavProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'history', label: 'History Timeline', icon: History },
  { id: 'ecology', label: 'Blue-Green Infrastructure', icon: Eye },
  { id: 'realtime', label: 'Real-Time Data & Pipeline', icon: Activity },
  { id: 'charts', label: '...what does it look like?', icon: Activity },
  { id: 'soundscape', label: '...what does it sound like?', icon: Volume2 },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'references', label: 'References', icon: BookOpen },
  { id: 'location', label: 'Site Coordinates', icon: MapPin }
];

const contentItems = navItems.filter((item) => item.id !== 'references');

export function SidebarNav({ activeSection, setActiveSection, isOpen, setIsOpen }: SidebarNavProps) {
  const handleNavClick = (id: string) => {
    const targetId = id === 'pipeline' ? 'realtime' : id;
    setActiveSection(targetId);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-paper-sheet border-b border-sage-primary/20 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 64 64" className="h-7 w-7 shrink-0 text-sage-primary" aria-hidden="true">
              <path d="M32 12c7 4 12 10 12 18 0 8-5 14-12 20-7-6-12-12-12-20 0-8 5-14 12-18Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M32 12v20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M24 24c3 2 7 2 10 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span className="[font-family:'Caveat',cursive] font-semibold text-ink-charcoal tracking-wide text-xl">
              UCL — <span className="text-sage-primary">SENSE</span>
            </span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-sage-primary/80 hover:text-ink-charcoal cursor-pointer"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Main Sidebar Container */}
      <aside 
        className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-sage-primary/20 bg-paper-bg pb-6 lg:z-30 lg:flex"
      >
        {/* Navigation Header block from Design */}
        <div className="p-6 border-b border-sage-primary/20">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0 text-sage-primary" aria-hidden="true">
              <path d="M32 12c7 4 12 10 12 18 0 8-5 14-12 20-7-6-12-12-12-20 0-8 5-14 12-18Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M32 12v20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M24 24c3 2 7 2 10 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <h1 className="[font-family:'Caveat',cursive] text-3xl font-semibold leading-tight tracking-wide text-ink-charcoal">
              UCL — <span className="block text-sage-primary">SENSE</span>
            </h1>
          </div>
        </div>

        {/* Navigation Table of Contents */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-2.5 text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer text-left ${
                    isActive 
                      ? 'sidebar-active text-ink-charcoal' 
                      : 'text-sage-primary/70 hover:text-ink-charcoal hover:bg-paper-dark/50'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-sage-primary' : 'text-sage-primary/50'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Curator / Footnote details */}
        <div className="p-6 text-[10px] uppercase tracking-tighter text-sage-primary/60 border-t border-sage-primary/10">
          Dissertation Prototype &copy; 2026<br/>Situated Ecological Interfaces
        </div>
      </aside>

      {/* Full-screen mobile menu */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-45 overflow-y-auto bg-[#eee7d8] lg:hidden">
          <div className="grid min-h-full grid-cols-1 md:grid-cols-2">
            <section className="border-b border-stone-500/30 p-7 md:border-b-0 md:border-r md:p-10">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500">Navigation</span>
              <h2 className="mt-2 [font-family:'Caveat',cursive] text-5xl font-semibold text-stone-800">Contents</h2>
              <div className="mt-4 h-px w-full bg-stone-500/40" />
              <nav className="mt-6">
                {contentItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="group flex w-full items-center gap-4 border-b border-stone-500/20 py-3 text-left"
                  >
                    <span className="font-mono text-[9px] text-stone-400">{String(index + 1).padStart(2, '0')}</span>
                    <span className="font-serif text-base text-stone-700 transition-transform group-hover:translate-x-1 group-hover:text-stone-950">
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>
            </section>

            <section className="p-7 md:p-10">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500">Links &amp; Contact</span>
              <h2 className="mt-2 [font-family:'Caveat',cursive] text-5xl font-semibold text-stone-800">More Information</h2>
              <div className="mt-4 h-px w-full bg-stone-500/40" />
              <div className="mt-6 space-y-2">
                <button onClick={() => handleNavClick('references')} className="flex w-full items-center justify-between border-b border-stone-500/20 py-3 font-serif text-stone-700">
                  References <BookOpen size={14} />
                </button>
                <a href="https://maps.ucl.ac.uk/22-gordon-street" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border-b border-stone-500/20 py-3 font-serif text-stone-700">
                  UCL Site Map <ExternalLink size={14} />
                </a>
                <a href="mailto:?subject=SENSE%20Living%20Wall" className="flex items-center justify-between border-b border-stone-500/20 py-3 font-serif text-stone-700">
                  Email <Mail size={14} />
                </a>
              </div>

              <div className="mt-8 flex items-center gap-5 border border-stone-500/35 bg-[#f5efe2] p-4">
                <div className="relative h-24 w-24 shrink-0 border border-stone-500/35 bg-white p-2">
                  <div className="flex h-full items-center justify-center text-center font-mono text-[8px] uppercase tracking-wider text-stone-400">
                    Survey<br />QR Code
                  </div>
                  <img
                    src="/images/survey-qr.png"
                    alt="Survey QR code"
                    className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] bg-white object-contain"
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div>
                  <ClipboardList size={16} className="mb-2 text-sage-primary" />
                  <h3 className="font-serif text-lg text-stone-800">Surveys</h3>
                  <p className="mt-1 text-[10px] leading-relaxed text-stone-500">Scan to contribute an observation to the SENSE research project.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
