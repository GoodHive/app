"use client";

import React, { FC, useState } from "react";

import { Input } from "@/app/components/input";
import { LinkButton } from "@/app/components/link-button";

import type {
  SearchFiltersProps,
  SearchQueryProps,
} from "./search-filters.types";
import { InputClasses, TRANSLATIONS } from "./search-filters.constants";
import searchIcon from "@/public/icons/search.svg";
import addIcon from "@/public/icons/add.svg";
import { skills } from "@constants/skills";
import { GooglePlaceSuggestion } from "@components/google-places-suggestion";
import { AutoSuggestInput } from "@components/autosuggest-input";

export const SearchFilters: FC<SearchFiltersProps> = (props) => {
  const [query, setQuery] = useState<SearchQueryProps>({
    search: "",
    location: "",
    name: "",
  });

  const { isSearchTalent = false } = props;

  const handleSearchChange = (skills: string[]) => {
    console.log("mara dile skill >>", skills);
    setQuery((q) => ({ ...q, search: skills[0] }));
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
      <div className="relative pt-12 space-y-6 w-6/12 sm:w-full md:w-full">
        <div className="absolute w-full top-0 left-0">
          <AutoSuggestInput
            classes={InputClasses}
            placeholder={TRANSLATIONS.searchPlaceholder}
            inputs={skills}
            selectedInputs={[query.search]}
            setSelectedInputs={handleSearchChange}
            isSingleInput
          />
        </div>

        <GooglePlaceSuggestion
          classes={InputClasses}
          handleLocationChange={handleLocationChange}
          label={TRANSLATIONS.locationPlaceholder}
        />

        <Input
          placeholder={
            isSearchTalent
              ? TRANSLATIONS.searchByDeveloperName
              : TRANSLATIONS.searchByCompanyName
          }
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
