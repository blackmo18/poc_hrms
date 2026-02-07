import { useMemo } from 'react';

export interface PayrollPeriod {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface UsePayrollPeriodsOptions {
  lookbackPeriods?: number; // How many periods back to include
  lookaheadPeriods?: number; // How many periods forward to include
  includeCurrentPeriod?: boolean; // Whether to include current period
}

export interface UsePayrollPeriodsReturn {
  periods: PayrollPeriod[];
  currentPeriod: PayrollPeriod | null;
  previousPeriod: PayrollPeriod | null;
  nextPeriod: PayrollPeriod | null;
}

/**
 * Hook for generating payroll periods with configurable lookback and lookahead periods
 * 
 * @param options Configuration options for period generation
 * @returns Object containing generated periods and convenience references
 */
export function usePayrollPeriods(options: UsePayrollPeriodsOptions = {}): UsePayrollPeriodsReturn {
  const {
    lookbackPeriods = 1,
    lookaheadPeriods = 1,
    includeCurrentPeriod = true
  } = options;

  const periods = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    const generatedPeriods: PayrollPeriod[] = [];
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Determine current period (1-15 or 16-end)
    const isFirstHalf = currentDay <= 15;
    let currentPeriodStart: { year: number; month: number; day: number };
    let currentPeriodEnd: { year: number; month: number; day: number };
    
    if (isFirstHalf) {
      currentPeriodStart = { year: currentYear, month: currentMonth, day: 1 };
      currentPeriodEnd = { year: currentYear, month: currentMonth, day: 15 };
    } else {
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      currentPeriodStart = { year: currentYear, month: currentMonth, day: 16 };
      currentPeriodEnd = { year: currentYear, month: currentMonth, day: lastDayOfMonth };
    }

    // Generate periods by counting backwards and forwards from current period
    const totalPeriods = lookbackPeriods + lookaheadPeriods + (includeCurrentPeriod ? 1 : 0);
    
    // Start from current period and generate all periods we need
    let currentPeriodYear = currentPeriodStart.year;
    let currentPeriodMonth = currentPeriodStart.month;
    let currentPeriodDay = currentPeriodStart.day;
    let isCurrentPeriodFirstHalf = currentPeriodDay === 1;
    
    for (let i = -lookbackPeriods; i <= lookaheadPeriods; i++) {
      // Skip if we shouldn't include current period and this is it
      if (!includeCurrentPeriod && i === 0) continue;
      
      let targetYear: number;
      let targetMonth: number;
      let periodStartDay: number;
      let periodEndDay: number;
      
      if (i === 0) {
        // Current period
        targetYear = currentPeriodStart.year;
        targetMonth = currentPeriodStart.month;
        periodStartDay = currentPeriodStart.day;
        periodEndDay = currentPeriodEnd.day;
      } else {
        // Calculate target period by moving i periods from current
        let periodOffset = i;
        targetYear = currentPeriodYear;
        targetMonth = currentPeriodMonth;
        
        // Determine if we start from first or second half of current period
        let startFromFirstHalf = isCurrentPeriodFirstHalf;
        
        if (periodOffset > 0) {
          // Looking ahead - move forward
          for (let j = 0; j < Math.abs(periodOffset); j++) {
            if (startFromFirstHalf) {
              // Move from 1-15 to 16-end of same month
              startFromFirstHalf = false;
            } else {
              // Move from 16-end to 1-15 of next month
              startFromFirstHalf = true;
              targetMonth += 1;
              if (targetMonth > 11) {
                targetMonth = 0;
                targetYear += 1;
              }
            }
          }
        } else {
          // Looking back - move backward
          for (let j = 0; j < Math.abs(periodOffset); j++) {
            if (!startFromFirstHalf) {
              // Move from 16-end to 1-15 of same month
              startFromFirstHalf = true;
            } else {
              // Move from 1-15 to 16-end of previous month
              startFromFirstHalf = false;
              targetMonth -= 1;
              if (targetMonth < 0) {
                targetMonth = 11;
                targetYear -= 1;
              }
            }
          }
        }
        
        // Set period days based on final position
        if (startFromFirstHalf) {
          periodStartDay = 1;
          periodEndDay = 15;
        } else {
          periodStartDay = 16;
          // Calculate correct days in month
          const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
          periodEndDay = daysInMonth[targetMonth];
          if (targetMonth === 1 && isLeapYear(targetYear)) {
            periodEndDay = 29;
          }
        }
      }
      
      const monthName = monthNames[targetMonth];
      const isCurrentPeriod = (i === 0);
      
      generatedPeriods.push({
        value: `${targetYear}-${targetMonth + 1}-${periodStartDay}-${periodEndDay}`,
        label: `${monthName} ${periodStartDay}-${periodEndDay}, ${targetYear}${isCurrentPeriod ? ' (current)' : ''}`,
        startDate: new Date(targetYear, targetMonth, periodStartDay),
        endDate: new Date(targetYear, targetMonth, periodEndDay)
      });
    }
    
    // Sort periods by start date (chronological order)
    return generatedPeriods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [lookbackPeriods, lookaheadPeriods, includeCurrentPeriod]);

  // Find convenience references
  const currentPeriod = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    // If we're in the first half of the month, current period is 1-15
    if (currentDay <= 15) {
      return periods.find(p => 
        p.startDate.getFullYear() === currentYear &&
        p.startDate.getMonth() === currentMonth &&
        p.startDate.getDate() === 1
      ) || null;
    } else {
      // If we're in the second half, current period is 16-end
      return periods.find(p => 
        p.startDate.getFullYear() === currentYear &&
        p.startDate.getMonth() === currentMonth &&
        p.startDate.getDate() === 16
      ) || null;
    }
  }, [periods]);

  const previousPeriod = useMemo(() => {
    if (!currentPeriod) return null;
    const currentIndex = periods.findIndex(p => p.value === currentPeriod?.value);
    return currentIndex > 0 ? periods[currentIndex - 1] : null;
  }, [periods, currentPeriod]);

  const nextPeriod = useMemo(() => {
    if (!currentPeriod) return null;
    const currentIndex = periods.findIndex(p => p.value === currentPeriod?.value);
    return currentIndex < periods.length - 1 ? periods[currentIndex + 1] : null;
  }, [periods, currentPeriod]);

  return {
    periods,
    currentPeriod,
    previousPeriod,
    nextPeriod
  };
}
