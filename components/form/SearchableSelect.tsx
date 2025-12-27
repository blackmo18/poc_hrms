import { useState, useEffect, useRef, useCallback } from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  maxResults?: number;
  debounceDelay?: number; // in seconds
  onSearch: (query: string) => Promise<Option[]> | Option[];
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  placeholder = "Search and select",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  required = false,
  maxResults = 10,
  debounceDelay = 0.3, // 300ms default
  onSearch,
}) => {
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const selectedValue = value !== undefined ? value : internalValue;

  const [query, setQuery] = useState<string>("");
  const [options, setOptions] = useState<Option[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  const debounceRef = useRef<number | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const results = await onSearch(searchQuery);
      setOptions(results.slice(0, maxResults));
    } catch (error) {
      console.error('Search error:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, maxResults]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim() && query.length >= 3) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, debounceDelay * 1000) as unknown as number;
    } else {
      setOptions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch, debounceDelay]);

  // Set selected option when value changes
  useEffect(() => {
    if (selectedValue && options.length > 0) {
      const option = options.find(opt => opt.value === selectedValue);
      if (option) {
        setSelectedOption(option);
        setQuery(option.label);
      }
    }
  }, [selectedValue, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);

    // If query is cleared, clear selection
    if (!newQuery.trim()) {
      handleSelect("");
    }
  };

  const handleSelect = (optionValue: string) => {
    const option = options.find(opt => opt.value === optionValue);
    setSelectedOption(option || null);
    setQuery(option ? option.label : "");
    setIsOpen(false);

    if (value === undefined) {
      setInternalValue(optionValue);
    }
    onChange(optionValue);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    // Delay closing to allow click on options
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative inline-block w-full">
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        required={required}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-gray-800 ${
          selectedValue
            ? "text-gray-800 dark:text-white/90"
            : "text-gray-400 dark:text-gray-400"
        } ${className}`}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />

      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-11 pointer-events-none">
        <svg
          className="stroke-current text-gray-600 dark:text-white/70"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-900 dark:border-gray-700 max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                onMouseDown={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))
          ) : query.trim() ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              No results found
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              Type to search...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
