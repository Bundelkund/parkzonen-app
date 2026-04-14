'use client';

import AddressSearch from '@/components/AddressSearch';
import type { AutocompleteSuggestion } from '@/types/zone';

export default function HomeSearch() {
  function handleSelect(suggestion: AutocompleteSuggestion) {
    // Future: navigate to city based on suggestion
    console.log('Home search selected:', suggestion.display_name);
  }

  return (
    <AddressSearch
      onSelect={handleSelect}
      placeholder="Adresse oder Stadt suchen..."
      className="w-full"
    />
  );
}
