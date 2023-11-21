"use client";

import React, { FC, useState } from "react";

import { Input } from "@/app/components/input";
import { LinkButton } from "@/app/components/link-button";

import type {
  SearchFiltersProps,
  SearchQueryProps,
} from "./search-filters.types";
import { TRANSLATIONS } from "./search-filters.constants";
import searchIcon from "@/public/icons/search.svg";
import addIcon from "@/public/icons/add.svg";
import { GooglePlaceSuggestion } from "../google-places-suggestion";

export const SearchFilters: FC<SearchFiltersProps> = (props) => {
  const [query, setQuery] = useState<SearchQueryProps>({
    search: "",
    location: "",
    name: "",
  });

  const { isSearchTalent = false } = props;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((q) => ({ ...q, search: event.target.value }));
  };

  const handleLocationChange = (address: string) => {
    setQuery((q) => ({ ...q, location: address }));
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((q) => ({ ...q, name: event.target.value }));
  };

  return (
    <div className="mx-5">
      <h1 className="my-5 font-bold text-2xl">{TRANSLATIONS.title}</h1>
      <div className=" space-y-6 w-6/12 sm:w-full md:w-full">
        <Input
          placeholder={TRANSLATIONS.searchPlaceholder}
          type="text"
          value={query.search}
          onChange={handleSearchChange}
        />
      
        <GooglePlaceSuggestion handleLocationChange={handleLocationChange} label={TRANSLATIONS.locationPlaceholder} />

        <Input
          placeholder={isSearchTalent ? TRANSLATIONS.searchByDeveloperName : TRANSLATIONS.searchByCompanyName}
          type="text"
          value={query.name}
          onChange={handleNameChange}
        />

        <div className="flex space-x-11">
          <LinkButton
            href={{
              href: isSearchTalent
                ? "/companies/search-talents"
                : "/talents/job-search",
              query,
            }}
            icon={searchIcon}
            iconSize="large"
            variant="primary"
          >
            {isSearchTalent ? "Search Talent" : "Search Jobs"}
          </LinkButton>

          <LinkButton
            href={
              isSearchTalent ? "/companies/create-job" : "/talents/my-profile"
            }
            icon={addIcon}
            iconSize="large"
            variant="secondary"
          >
            {isSearchTalent ? "Create Job" : "Create Profile"}
          </LinkButton>
        </div>
      </div>
    </div>
  );
};
