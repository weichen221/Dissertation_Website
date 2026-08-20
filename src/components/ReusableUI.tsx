/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

export function HandwrittenTitle({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) {
  return (
    <motion.h2
      style={{ fontFamily: '"Caveat", cursive' }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.7 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.045 } },
      }}
      className={`relative block w-full pb-5 text-center [font-family:'Caveat',cursive] font-semibold leading-[0.9] tracking-[0.01em] ${className}`}
    >
      {Array.from(children).map((character, index) => (
        <motion.span
          key={`${character}-${index}`}
          style={{ fontFamily: 'inherit' }}
          variants={{
            hidden: { opacity: 0, y: 7, rotate: -2 },
            visible: { opacity: 1, y: 0, rotate: 0 },
          }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="inline-block whitespace-pre"
        >
          {character}
        </motion.span>
      ))}
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.7, delay: Math.min(children.length * 0.045 + 0.08, 1.35), ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-1 left-0 h-px w-full origin-left bg-current opacity-50"
      />
    </motion.h2>
  );
}

// SectionFrame provides an elegant double-bordered or dashed outline around sections,
// simulating botanical drawings or paper exhibits rather than floating cards.
export function SectionFrame({
  children,
  title,
  subtitle,
  badge,
  id,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  id?: string;
}) {
  return (
    <section id={id} className="py-12 border-b border-sage-primary/10 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header Block */}
        <div className="mb-8 relative">
          {badge && (
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-sage-primary/70 block mb-2 font-semibold">
              — {badge}
            </span>
          )}
          <HandwrittenTitle className="text-5xl md:text-6xl text-ink-charcoal mb-4">
            {title}
          </HandwrittenTitle>
          {subtitle && (
            <p className="text-sm text-sage-primary/80 max-w-xl italic font-serif leading-relaxed">
              {subtitle}
            </p>
          )}
          
          {/* Ornamental botanical flourish */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-15 hidden sm:block text-sage-primary">
            <Leaf size={32} strokeWidth={1} />
          </div>
        </div>

        {/* Content Container with a very soft dashed border instead of card shadows */}
        <div className="paper-border-dashed p-6 md:p-8 bg-paper-sheet/50 relative">
          {children}
        </div>
      </div>
    </section>
  );
}

// PaperNote acts like a physical field note pinned to the exhibit board.
export function PaperNote({
  children,
  className = '',
  title,
  annotation,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  annotation?: string;
}) {
  return (
    <div className={`bg-paper-sheet paper-border paper-curl p-6 shadow-sm relative text-sm text-ink-charcoal ${className}`}>
      {annotation && (
        <span className="absolute -top-3 left-4 bg-paper-bg px-2 py-0.5 text-[9px] font-mono tracking-wider text-sage-primary uppercase border border-sage-primary/20 font-semibold">
          {annotation}
        </span>
      )}
      {title && (
        <h4 className="font-serif font-bold text-base text-ink-charcoal mb-3 border-b border-sage-primary/10 pb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sage-primary"></span>
          {title}
        </h4>
      )}
      <div className="leading-relaxed font-sans text-stone-700">{children}</div>
    </div>
  );
}

// CaptionStrip sits snugly below images or diagrams to give immediate ecological context.
export function CaptionStrip({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-paper-dark/40 paper-border border-t-0 py-2.5 px-4 text-xs text-sage-primary flex flex-wrap items-center justify-between gap-4 font-mono ${className}`}>
      {children}
    </div>
  );
}

// QuietDataBadge displays individual metric readings inside a delicate, compact, low-contrast tag.
export function QuietDataBadge({
  label,
  value,
  unit,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 border border-sage-primary/25 bg-paper-sheet/70 text-xs hover:border-sage-primary/60 transition-colors">
      {Icon && <Icon size={14} className="text-sage-primary/70 shrink-0" />}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-mono text-sage-primary/60 leading-none mb-0.5">
          {label}
        </span>
        <div className="flex items-baseline gap-0.5 leading-none font-mono">
          <span className="font-bold text-ink-charcoal text-sm">{value}</span>
          {unit && <span className="text-[10px] text-sage-primary/50">{unit}</span>}
          {trend && (
            <span className={`text-[9px] ml-1 ${
              trend === 'up' ? 'text-green-700 font-bold' : trend === 'down' ? 'text-amber-700 font-bold' : 'text-sage-primary/50'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// SegmentedToggle represents a quiet, paper-style segmented selector.
export function SegmentedToggle<T extends string>({
  options,
  selected,
  onChange,
  className = '',
}: {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex p-0.5 border border-sage-primary/20 bg-paper-dark/30 text-xs font-mono select-none ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 transition-all cursor-pointer relative ${
              isSelected
                ? 'bg-paper-sheet text-sage-primary font-bold border border-sage-primary/15 shadow-xs'
                : 'text-sage-primary/70 hover:text-ink-charcoal'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// AnnotationPanel renders pin overlays or side notes matching image positions.
export function AnnotationPanel({
  title,
  children,
  x,
  y,
  active,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  x: string; // e.g. "20%"
  y: string; // e.g. "35%"
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="absolute z-20"
      style={{ left: x, top: y }}
    >
      {/* Pulse Dot */}
      <button
        onClick={onClick}
        className="w-5 h-5 rounded-full bg-sage-primary text-white font-mono flex items-center justify-center text-[10px] focus:outline-none hover:scale-115 transition-transform shadow-xs relative cursor-pointer"
      >
        <span className="absolute inset-0 rounded-full bg-sage-primary/40 animate-ping"></span>
        <Leaf size={10} className="relative z-10" />
      </button>

      {/* Floating Description Note (if active) */}
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-6 top-0 -translate-y-1/2 w-48 bg-paper-sheet paper-border p-3 text-xs leading-relaxed shadow-sm z-30"
        >
          <p className="font-serif font-bold text-ink-charcoal mb-1">{title}</p>
          <div className="text-stone-700 font-sans">{children}</div>
        </motion.div>
      )}
    </div>
  );
}
