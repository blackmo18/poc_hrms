'use client';

import { useState, useEffect } from 'react';
import PeriodSwitcher from './components/PeriodSwitcher';
import HeroProgressCard from './components/HeroProgressCard';
import SecondaryStats from './components/SecondaryStats';
import QuickActions from './components/QuickActions';
import DailyEntries from './components/DailyEntries';

interface TimeEntry {
  date: string;
  clockInAt: string;
  clockOutAt: string;
  totalWorkMinutes: number;
  status: 'OPEN' | 'CLOSED';
  type: 'Regular' | 'Late' | 'OT' | 'Undertime';
}

interface CutoffPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
  status: 'In Progress' | 'Completed';
  totalHours: number;
  targetHours: number;
}

export default function CutoffOverviewPage() {
  const [selectedCutoff, setSelectedCutoff] = useState<CutoffPeriod | null>(null);
  const [cutoffs, setCutoffs] = useState<CutoffPeriod[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCutoffDropdown, setShowCutoffDropdown] = useState(false);
  const [stats, setStats] = useState({ otHours: 0, nightDifferential: 0, lates: 0 });

  useEffect(() => {
    initializeCutoffs();
  }, []);

  useEffect(() => {
    if (selectedCutoff) {
      fetchEntriesForCutoff(selectedCutoff);
    }
  }, [selectedCutoff]);

  const initializeCutoffs = async () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    // Determine current cutoff (1-15 or 16-last day)
    const isFirstHalf = currentDate <= 15;
    
    let cutoff1Start, cutoff1End, cutoff2Start, cutoff2End;

    if (isFirstHalf) {
      // Current: 1-15, Next: 16-last day
      cutoff1Start = new Date(currentYear, currentMonth, 1);
      cutoff1End = new Date(currentYear, currentMonth, 15);
      cutoff2Start = new Date(currentYear, currentMonth, 16);
      cutoff2End = new Date(currentYear, currentMonth + 1, 0);
    } else {
      // Current: 16-last day, Previous: 1-15
      cutoff1Start = new Date(currentYear, currentMonth, 16);
      cutoff1End = new Date(currentYear, currentMonth + 1, 0);
      cutoff2Start = new Date(currentYear, currentMonth, 1);
      cutoff2End = new Date(currentYear, currentMonth, 15);
    }

    const currentCutoff: CutoffPeriod = {
      id: 'current',
      startDate: cutoff1Start,
      endDate: cutoff1End,
      label: `${cutoff1Start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${cutoff1End.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      status: 'In Progress',
      totalHours: 72.5,
      targetHours: 88,
    };

    const previousCutoff: CutoffPeriod = {
      id: 'previous',
      startDate: cutoff2Start,
      endDate: cutoff2End,
      label: `${cutoff2Start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${cutoff2End.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      status: 'Completed',
      totalHours: 88,
      targetHours: 88,
    };

    setCutoffs([currentCutoff, previousCutoff]);
    setSelectedCutoff(currentCutoff);
  };

  const fetchEntriesForCutoff = async (cutoff: CutoffPeriod) => {
    setLoading(true);
    try {
      const startDate = cutoff.startDate.toISOString().split('T')[0];
      const endDate = cutoff.endDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/attendance/cutoff?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cutoff data');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setEntries(result.data.entries || []);
        
        // Update stats from API response
        if (result.data.stats) {
          setStats({
            otHours: result.data.stats.otHours || 0,
            nightDifferential: result.data.stats.nightDifferential || 0,
            lates: result.data.stats.lates || 0,
          });
        }

        // Update selected cutoff with actual total hours from API
        if (result.data.totalHours) {
          setSelectedCutoff(prev => 
            prev ? { ...prev, totalHours: result.data.totalHours } : null
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const daysLeft = selectedCutoff ? Math.ceil((selectedCutoff.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const percentage = selectedCutoff ? calculatePercentage(selectedCutoff.totalHours, selectedCutoff.targetHours) : 0;

  return (
    <>
      <PeriodSwitcher
        cutoffs={cutoffs}
        selectedCutoff={selectedCutoff}
        onSelectCutoff={setSelectedCutoff}
      />

      {selectedCutoff && (
        <>
          <HeroProgressCard
            selectedCutoff={selectedCutoff}
            percentage={percentage}
            daysLeft={daysLeft}
            loading={loading}
          />

          <SecondaryStats
            otHours={stats.otHours}
            nightDifferential={stats.nightDifferential}
            lates={stats.lates}
            loading={loading}
          />

          <QuickActions />

          <DailyEntries entries={entries} loading={loading} />
        </>
      )}
    </>
  );
}
