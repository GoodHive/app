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
import { AutoSuggestInput } from "@components/autosuggest-input";
import { ToggleButton } from "../toggle-button";
import { CitySuggestion } from "../city-suggestor/city-suggestor";

export const SearchFilters: FC<SearchFiltersProps> = (props) => {
  const initialQuery: SearchQueryProps = {
    search: "",
    location: "",
    name: "",
    recruiter: false,
    mentor: false,
    onlyTalent: false,
    onlyMentor: false,
    onlyRecruiter: false,
  };

  const [query, setQuery] = useState<SearchQueryProps>(initialQuery);
  const [toggleValues, setToggleValues] = useState({
    onlyTalent: false,
    onlyMentor: false,
    onlyRecruiter: false,
  });

  const { isSearchTalent = false } = props;

  const title = isSearchTalent
    ? TRANSLATIONS.talentSearchTitle
    : TRANSLATIONS.jobSearchTitle;

  const handleSearchChange = (skills: string[]) => {
    setQuery((q) => ({ ...q, search: skills[0] }));
  };

  const handleLocationChange = (address: { name: string }) => {
    setQuery((q) => ({ ...q, location: address.name }));
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((q) => ({ ...q, name: event.target.value }));
  };

  const handleOpenToRecruiterChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setQuery((q) => ({ ...q, recruiter: event.target.checked }));
  };

  const handleOpenToMentorChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setQuery((q) => ({ ...q, mentor: event.target.checked }));
  };

  const handleClearFilters = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation

    // Reset query and toggle states
    setQuery(initialQuery);
    setToggleValues({
      onlyTalent: false,
      onlyMentor: false,
      onlyRecruiter: false,
    });
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/60 via-white to-yellow-50/40 backdrop-blur-sm">
      <div className="border-b border-amber-200/60 pb-6 mb-8">
        <h1 className="my-6 font-bold text-2xl text-gray-900">{title}</h1>
        <div className="relative pt-12 space-y-6 w-full max-w-2xl">
          <div className="absolute w-full top-0 left-0">
            <AutoSuggestInput
              classes={InputClasses.join(" ")}
              placeholder={TRANSLATIONS.searchPlaceholder}
              inputs={skills}
              selectedInputs={[query.search]}
              setSelectedInputs={handleSearchChange}
              isSingleInput
            />
          </div>

          <CitySuggestion
            classes={InputClasses.join(" ")}
            onCitySelect={handleLocationChange as any}
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
            classes={InputClasses.join(" ")}
          />

          {isSearchTalent ? (
            <div className="flex gap-6 my-6 px-1 sm:flex-col sm:gap-4">
              <ToggleButton
                label={TRANSLATIONS.onlyTalent}
                name="onlyTalent"
                checked={toggleValues.onlyTalent}
                setValue={(name: string, value: boolean) => {
                  setToggleValues((prev) => ({
                    ...prev,
                    [name]: value,
                  }));
                }}
              />
              <ToggleButton
                label={TRANSLATIONS.onlyMentor}
                name="onlyMentor"
                checked={toggleValues.onlyMentor}
                setValue={(name: string, value: boolean) => {
                  setToggleValues((prev) => ({
                    ...prev,
                    [name]: value,
                  }));
                }}
              />
              <ToggleButton
                label={TRANSLATIONS.onlyRecruiter}
                name="onlyRecruiter"
                checked={toggleValues.onlyRecruiter}
                setValue={(name: string, value: boolean) => {
                  setToggleValues((prev) => ({
                    ...prev,
                    [name]: value,
                  }));
                }}
              />
            </div>
          ) : (
            <div className="flex gap-6 sm:flex-col sm:gap-4">
              <ToggleButton
                label={TRANSLATIONS.openToRecruiter}
                name="openToRecruiter"
                checked={query.recruiter}
                onChange={handleOpenToRecruiterChange}
              />
              <ToggleButton
                label={TRANSLATIONS.openToMentor}
                name="openToMentor"
                checked={query.mentor}
                onChange={handleOpenToMentorChange}
              />
            </div>
          )}

          <div className="flex justify-between gap-4 pt-4">
            <div className="flex gap-3">
              <LinkButton
                href={{
                  pathname: isSearchTalent
                    ? "/companies/search-talents"
                    : "/talents/job-search",
                  query: { ...query, ...toggleValues },
                }}
                icon={searchIcon}
                iconSize="medium"
                variant="primary"
              >
                {isSearchTalent ? "Search Talent" : "Search Jobs"}
              </LinkButton>

              <LinkButton
                href="#"
                icon={false as any}
                iconSize="medium"
                variant="secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </LinkButton>
            </div>

            <LinkButton
              href={
                isSearchTalent ? "/companies/create-job" : "/talents/my-profile"
              }
              icon={addIcon}
              iconSize="medium"
              variant="secondary"
            >
              {isSearchTalent ? "Create Job" : "My Talent Profile"}
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
};
