import React, { useState, useEffect } from "react";
import cities from "../../../json/cities.json";

interface City {
  name: string;
  id: string;
  country: string;
}

interface CitySuggestionProps {
  onCitySelect?: (city: City) => void;
  classes?: string;
  value?: string;
  onQueryChange?: (value: string) => void;
  placeholder?: string;
}

export const CitySuggestion: React.FC<CitySuggestionProps> = ({
  onCitySelect,
  classes,
  value = "",
  onQueryChange,
  placeholder = "Type a city name...",
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Update the debouncedQuery after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer); // Cleanup the timer on component unmount or query change
  }, [query]);

  // Fetch cities whenever the debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      return;
    }

    const filteredCities = cities.filter((city) =>
      city.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
    );
    setSuggestions(filteredCities as City[]);
  }, [debouncedQuery]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onQueryChange?.(nextValue);
  };

  const handleCitySelect = (city: City) => {
    setQuery(city.name);
    setSuggestions([]);
    onCitySelect?.(city);
    onQueryChange?.(city.name);
  };

  const handleAddNewCity = () => {
    if (query.trim() && !cities.some(city => city.name.toLowerCase() === query.toLowerCase())) {
      const newCity: City = {
        id: `new-${Date.now()}`,
        name: query.trim(),
        country: 'Custom'
      };
      setQuery(newCity.name);
      setSuggestions([]);
      onCitySelect?.(newCity);
      onQueryChange?.(newCity.name);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={classes}
      />
      {(suggestions.length > 0 || (query.trim() && !cities.some(city => city.name.toLowerCase() === query.toLowerCase()))) && (
        <ul style={{
          position: 'absolute',
          zIndex: 10,
          width: '100%',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxHeight: '15rem',
          overflowY: 'auto',
          marginTop: '0.25rem'
        }}>
          {suggestions.map((city) => (
            <li
              key={city.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCitySelect(city);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {city.name}
              {city.country ? `, ${city.country}` : ""}
            </li>
          ))}
          {query.trim() && !cities.some(city => city.name.toLowerCase() === query.toLowerCase()) && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddNewCity();
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                color: '#2563eb',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              + Add "{query}" as new city
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
