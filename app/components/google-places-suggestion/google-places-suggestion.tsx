"use client";

import { FC, useEffect, useRef } from "react";
import { GooglePlaceSuggestionProps } from "./google-place-suggestion.types";
import {
  GMAPS_API_URL,
  GMAP_API_KEY,
} from "./google-places-suggestion.constants";

declare global {
  interface Window {
    google: any;
  }
}

function loadAsyncScript(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    Object.assign(script, {
      type: "text/javascript",
      async: true,
      src,
    });
    script.addEventListener("load", () => resolve(script));
    document.head.appendChild(script);
  });
}

export const GooglePlaceSuggestion: FC<GooglePlaceSuggestionProps> = (
  props
) => {
  const { handleLocationChange, label } = props;
  const searchInput = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleLocationChange(value);
  };

  const initMapScript = () => {
    if (window.google) {
      return Promise.resolve();
    }
    const src = `${GMAPS_API_URL}?key=${GMAP_API_KEY}&libraries=places&v=weekly`;
    return loadAsyncScript(src);
  };

  const onChangeAddress = (autocomplete: any) => {
    const address_component = autocomplete.getPlace().address_components;
    const city = address_component.filter(
      (f: any) =>
        JSON.stringify(f.types) === JSON.stringify(["locality", "political"])
    )[0].short_name;

    handleLocationChange(city);
  };

  const initAutocomplete = () => {
    if (!searchInput.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      searchInput.current
    );

    autocomplete.setFields(["address_component", "geometry"]);
    autocomplete.addListener("place_changed", () =>
      onChangeAddress(autocomplete)
    );
  };

  useEffect(() => {
    initMapScript().then(() => initAutocomplete());
  }, []);

  return (
    <div>
      <input
        aria-label="Search location"
        className="w-full px-4 py-2 text-base bg-white bg-clip-padding border border-solid rounded-full font-normal text-gray-600 border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
        ref={searchInput}
        onChange={handleChange}
        type="text"
        placeholder={label}
      />
    </div>
  );
};
