/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CloudRain, Heart, Send } from 'lucide-react';
import { CommunityObservation, SensorData } from '../lib/types';
import { PaperNote } from './ReusableUI';

interface CommunityObservationFormProps {
  currentSensorData: SensorData;
}

const OBSERVATION_CHIPS = [
  'I heard a bird',
  'I saw insects',
  'The wall looks dry',
  'I noticed flowers',
  'It feels cooler here',
  'It feels quieter here',
  'I heard an unusual sound'
];

export function CommunityObservationForm({ currentSensorData }: CommunityObservationFormProps) {
  const [observations, setObservations] = useState<CommunityObservation[]>([]);
  const [selectedChip, setSelectedChip] = useState('');
  const [note, setNote] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCommunityLog = async () => {
      try {
        const response = await fetch('/api/community-observations?limit=50');
        if (!response.ok) throw new Error();
        const result = await response.json();
        setObservations(Array.isArray(result.data) ? result.data : []);
      } catch {
        setErrorMessage('The community log is temporarily unavailable.');
      }
    };
    loadCommunityLog();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedChip || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/community-observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observationType: selectedChip,
          note: note.trim() || undefined,
          weather_summary: currentSensorData.rainfall_mm > 0
            ? `${currentSensorData.rainfall_mm}mm precipitation`
            : 'No rainfall recorded'
        })
      });
      if (!response.ok) throw new Error();

      const result = await response.json();
      const savedObservation = result.data as CommunityObservation;
      setObservations((current) => [
        savedObservation,
        ...current.filter((observation) => observation.id !== savedObservation.id)
      ]);
      setSelectedChip('');
      setNote('');
      setSubmitSuccess(true);
      window.setTimeout(() => setSubmitSuccess(false), 4000);
    } catch {
      setErrorMessage('The observation could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <form onSubmit={handleSubmit} className="md:col-span-6 space-y-6">
        <div>
          <label className="text-xs uppercase font-mono text-sage-primary/70 block mb-2 font-bold tracking-wider">
            1. Select an Ecological Observation *
          </label>
          <div className="flex flex-wrap gap-2">
            {OBSERVATION_CHIPS.map((chip) => (
              <button
                type="button"
                key={chip}
                onClick={() => setSelectedChip(chip)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors border cursor-pointer ${
                  selectedChip === chip
                    ? 'bg-sage-primary text-paper-sheet border-sage-primary font-semibold'
                    : 'bg-paper-sheet hover:bg-paper-dark/30 text-sage-primary border-sage-primary/20'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase font-mono text-sage-primary/70 block mb-2 font-bold tracking-wider">
            2. Add Optional Field Notes
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder="Type your notes here... (e.g., seen nested birds, sound details, cooling sensations)"
            rows={3}
            className="w-full bg-paper-sheet border border-sage-primary/20 p-3 text-xs focus:outline-none focus:border-sage-primary font-sans leading-relaxed text-ink-charcoal"
          />
        </div>

        <div className="border-t border-sage-primary/10 pt-3 text-[10px] text-sage-primary/60 font-mono">
          <div className="flex items-center gap-1.5">
            <CloudRain size={10} className="text-sage-primary/80" />
            <span>
              WEATHER_STAMP: {currentSensorData.rainfall_mm > 0
                ? `${currentSensorData.rainfall_mm}mm precipitation`
                : 'No rainfall recorded'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="submit"
            disabled={!selectedChip || isSubmitting}
            className={`px-4 py-2 font-mono text-xs flex items-center gap-2 transition-colors border ${
              selectedChip && !isSubmitting
                ? 'bg-sage-primary hover:bg-sage-dark text-paper-sheet border-sage-primary font-bold cursor-pointer'
                : 'bg-paper-dark text-sage-primary/40 border-sage-primary/10 cursor-not-allowed'
            }`}
          >
            <Send size={12} />
            <span>{isSubmitting ? 'SAVING...' : 'SUBMIT_NOTE'}</span>
          </button>

          {submitSuccess && (
            <span className="text-[10px] text-green-700 font-mono flex items-center gap-1">
              <Heart size={10} className="fill-green-700 text-green-700 animate-pulse" />
              Observation saved to the community log!
            </span>
          )}
        </div>
        {errorMessage && <p className="text-[10px] text-red-700 font-mono">{errorMessage}</p>}
      </form>

      <div className="md:col-span-6 space-y-4">
        <div className="border-b border-sage-primary/20 pb-2 flex items-center justify-between">
          <span className="text-xs uppercase font-mono text-sage-primary/70 font-bold tracking-wider">
            Recent Community Log entries
          </span>
          <span className="text-[10px] font-mono text-sage-primary/50">{observations.length} logs</span>
        </div>

        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {observations.length === 0 ? (
            <p className="text-xs text-sage-primary/50 italic py-6 text-center font-serif">
              No community logs recorded yet. Be the first to add an observation.
            </p>
          ) : (
            observations.map((observation) => (
              <div key={observation.id}>
                <PaperNote
                  annotation={observation.observationType}
                  className="hover:scale-[1.01] transition-transform"
                >
                  {observation.note && (
                    <p className="font-serif italic text-ink-charcoal text-sm mb-2 font-semibold">
                      “{observation.note}”
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-sage-primary/50 mt-1 border-t border-sage-primary/10 pt-1.5">
                    <span>
                      {new Date(observation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(observation.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    {observation.weather_summary && (
                      <span className="bg-paper-dark/40 px-1.5 py-0.5 rounded-sm border border-sage-primary/10 text-[9px]">
                        {observation.weather_summary}
                      </span>
                    )}
                  </div>
                </PaperNote>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
