import React, { FC, useEffect, useRef, useState } from "react";

import LabelOption from "@interfaces/label-option";

interface Props {
  labelText?: string;
  name?: string;
  required: boolean;
  disabled?: boolean;
  inputValue: LabelOption | null;
  setInputValue: (option: LabelOption | null) => void;
  options: LabelOption[];
  defaultValue?: LabelOption;
}

export const SelectInput: FC<Props> = ({
  labelText,
  required,
  disabled,
  inputValue,
  options,
  defaultValue,
  setInputValue,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<LabelOption | null>(
    defaultValue || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInputClickAndCloseOptions = (option: LabelOption) => {
    setInputValue(option);
    setIsOptionsOpen(false);
    setSearchTerm('');
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOptions = filteredOptions.map((option) => (
    <div
      key={option.value}
      className="px-4 py-2 cursor-pointer hover:bg-amber-50 hover:text-amber-800 transition-colors duration-200"
      onClick={() => handleInputClickAndCloseOptions(option)}
    >
      {option.label}
    </div>
  ));

  let selectStyle =
    "block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 cursor-pointer focus:text-black focus:bg-white";
  if (disabled) {
    selectStyle =
      "form-control pointer-events-none block w-full px-4 py-3 text-base font-light text-gray-200 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl";
  }

  useEffect(() => {
    if (defaultValue && !inputValue) {
      setInputValue(defaultValue);
    }
  }, [defaultValue, inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOptionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium">
        {labelText}
        {required && <span>*</span>}
      </label>
      <div className="flex items-center">
        <p
          className={`${selectStyle} ${isOptionsOpen ? 'border-amber-500' : ''}`}
          onClick={() => setIsOptionsOpen(() => !isOptionsOpen)}
          style={{
            color:
              inputValue && inputValue.label !== "Select on options"
                ? "black"
                : "gray",
          }}
        >
          {inputValue ? inputValue.label : "Select on options"}
        </p>
        <div className="absolute pointer-events-none right-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M6.293 7.293a1 1 0 0 1 1.414 0L10 9.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {isOptionsOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-amber-300 rounded-xl shadow-lg max-h-80">
          {/* Search Input */}
          <div className="p-3 border-b border-amber-200">
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredOptions.length > 0) {
                  handleInputClickAndCloseOptions(filteredOptions[0]);
                }
                if (e.key === 'Escape') {
                  setIsOptionsOpen(false);
                  setSearchTerm('');
                }
              }}
              className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none"
              autoFocus
            />
          </div>
          
          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length > 0 ? (
              renderOptions
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
