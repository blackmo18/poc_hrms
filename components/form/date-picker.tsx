import { useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  dateOffset?: number;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  dateOffset,
}: PropsType) {
  // Calculate default date with offset if provided
  const calculateDefaultDate = () => {
    if (defaultDate) {
      return defaultDate;
    }
    
    if (dateOffset !== undefined && dateOffset !== 0) {
      const date = new Date();
      date.setFullYear(date.getFullYear() + dateOffset);
      return date.toISOString().split('T')[0];
    }
    
    return defaultDate;
  };

  const finalDefaultDate = calculateDefaultDate();
  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: false, // Changed to false to allow popup above modal
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: finalDefaultDate,
      onChange,
      // Set the initial view to show the correct month/year for offset dates
      ...(dateOffset !== undefined && dateOffset !== 0 && {
        defaultDate: finalDefaultDate,
      }),
      // Add z-index to appear above modal
      position: "auto center",
    });

    // Add custom styles to ensure calendar appears above modal
    const addStyles = () => {
      const style = document.createElement('style');
      style.innerHTML = `
        .flatpickr-calendar {
          z-index: 99999 !important;
        }
        .flatpickr-calendar.open {
          z-index: 99999 !important;
        }
      `;
      document.head.appendChild(style);
      return style;
    };

    const styleElement = addStyles();

    // If we have an offset date, set the calendar to show that month/year
    if (dateOffset !== undefined && dateOffset !== 0 && finalDefaultDate) {
      const targetDate = new Date(finalDefaultDate);
      if (!Array.isArray(flatPickr)) {
        flatPickr.jumpToDate(targetDate);
      }
    }

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
      // Clean up the added styles
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [mode, onChange, id, finalDefaultDate, dateOffset]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
