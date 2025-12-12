'use client';

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { sanitizeInput } from '@/lib/utils';

export default function SearchInput({ 
  placeholder = 'Search...', 
  onSearch,
  debounceMs = 300,
  className = ''
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      // Best Practice 14: Sanitize search input before passing to API
      const sanitized = sanitizeInput(value, 200);
      onSearch(sanitized);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}

SearchInput.propTypes = {
  placeholder: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  debounceMs: PropTypes.number,
  className: PropTypes.string,
};
