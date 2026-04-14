'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { AutocompleteSuggestion } from '@/types/zone';

interface AddressSearchProps {
  onSelect?: (suggestion: AutocompleteSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressSearch({
  onSelect,
  placeholder = 'Adresse suchen...',
  className = '',
}: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/address/autocomplete?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const items: AutocompleteSuggestion[] = data.suggestions ?? [];
      setSuggestions(items);
      setIsOpen(items.length > 0);
      setActiveIndex(-1);
    } catch {
      // Silently fail — do not break UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced input handler (1200ms — AC-106)
  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 1200);
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select a suggestion
  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    setQuery(suggestion.display_name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect?.(suggestion);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Adresse suchen"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.lat}-${suggestion.lng}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`min-h-[44px] cursor-pointer px-4 py-3 text-sm text-slate-700 ${
                index === activeIndex ? 'bg-slate-50' : ''
              }`}
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
