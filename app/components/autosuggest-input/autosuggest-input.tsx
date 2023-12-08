"use client";

import clsx from "clsx";
import { FC, useState } from "react";
import Autosuggest from "react-autosuggest";
import { AutosuggestInputProps } from "./autosuggest-input.types";

export const AutoSuggestInput: FC<AutosuggestInputProps> = (props) => {
  const [inputValue, setInputValue] = useState("");

  const {
    inputs,
    classes,
    placeholder,
    selectedInputs,
    setSelectedInputs,
    isSingleInput = false,
  } = props;

  const getSuggestions = (value: string) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0
      ? []
      : inputs.filter(
          (inputs) => inputs.toLowerCase().slice(0, inputLength) === inputValue
        );
  };

  const onSuggestionSelected = (
    event: React.FormEvent<HTMLInputElement>,
    { suggestion }: Autosuggest.SuggestionSelectedEventData<string>
  ) => {
    if (isSingleInput) {
      setSelectedInputs([suggestion]);
      return;
    }
    if (!selectedInputs.includes(suggestion)) {
      setSelectedInputs([...selectedInputs, suggestion]);
    }
  };

  const renderSuggestion = (suggestion: string) => (
    <div className="mx-1 px-2 py-2 z-10 hover:text-[#FF8C05] bg-white shadow-md max-h-48 overflow-y-auto border-gray-400 border-b-[0.5px] border-solid">
      {suggestion}
    </div>
  );

  const inputProps = {
    className: classes
      ? clsx(classes)
      : "relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-clip-padding transition ease-in-out focus:text-black bg-gray-100 focus:outline-none focus:ring-0",
    placeholder: placeholder || "JavaScript, NextJS,...",
    type: "text",
    maxLength: 255,
    name: "skills",
    value: inputValue,
    onChange(
      event: React.FormEvent<HTMLElement>,
      { newValue }: { newValue: string }
    ) {
      setInputValue(newValue);
    },
    onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (isSingleInput) {
          setSelectedInputs([inputValue]);
          return;
        }
        if (!selectedInputs.includes(inputValue)) {
          setSelectedInputs([...selectedInputs, inputValue]);
        }
        setInputValue("");
      }
    },
  };

  return (
    <Autosuggest
      suggestions={getSuggestions(inputValue)}
      onSuggestionsFetchRequested={() => ""}
      onSuggestionsClearRequested={() => ""}
      getSuggestionValue={(skill) => skill}
      onSuggestionSelected={onSuggestionSelected}
      renderSuggestion={renderSuggestion}
      inputProps={inputProps}
    />
  );
};
