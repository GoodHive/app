"use client";

import { Input } from "@/app/components/input";
import { LinkButton } from "@/app/components/link-button";
import { useRouter, useSearchParams } from "next/navigation";
import React, { FC, useCallback, useEffect, useState } from "react";
import { CitySuggestion } from "../city-suggestor/city-suggestor";
import { SkillsSuggestionMulti } from "../skills-suggestor/skills-suggestor-multi";
import { ToggleSwitch } from "../toggle-switch/toggle-switch";
import { TRANSLATIONS } from "./search-filters.constants";
import type { SearchFiltersProps } from "./search-filters.types";
import { Users, Briefcase, FolderOpen, Sparkles, Target } from "lucide-react";

export const SearchFilters: FC<SearchFiltersProps> = (props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    searchParams.get("search") ? searchParams.get("search")!.split(",").map(s => s.trim()).filter(s => s) : []
  );
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [companyName, setCompanyName] = useState(
    searchParams.get("name") || "",
  );

  // Filter switches for jobs and talents
  const [openToRecruiter, setOpenToRecruiter] = useState(
    searchParams.get("recruiter") === "true",
  );
  const [openToMentor, setOpenToMentor] = useState(
    searchParams.get("mentor") === "true",
  );
  const [onlyTalent, setOnlyTalent] = useState(
    searchParams.get("onlyTalent") === "true",
  );
  const [onlyMentor, setOnlyMentor] = useState(
    searchParams.get("onlyMentor") === "true",
  );
  const [onlyRecruiter, setOnlyRecruiter] = useState(
    searchParams.get("onlyRecruiter") === "true",
  );

  // New filter state for "Open to" filters
  const [openToTalents, setOpenToTalents] = useState(
    searchParams.get("openToTalents") === "true",
  );

  const { isSearchTalent = false } = props;

  const title = isSearchTalent
    ? TRANSLATIONS.talentSearchTitle
    : TRANSLATIONS.jobSearchTitle;

  // Real-time search with debouncing
  const performSearch = useCallback(
    (skills: string[], loc: string, company: string, filters: any = {}, resetPage = true) => {
      const params = new URLSearchParams(searchParams);

      // Clear page parameter only when actually searching (not on initial load)
      if (resetPage) {
        params.delete("page");
      }

      if (skills.length > 0) {
        params.set("search", skills.join(","));
      } else {
        params.delete("search");
      }

      if (loc.trim()) {
        params.set("location", loc.trim());
      } else {
        params.delete("location");
      }

      if (company.trim()) {
        params.set("name", company.trim());
      } else {
        params.delete("name");
      }

      // Handle filter switches
      const currentFilters = {
        openToRecruiter:
          filters.openToRecruiter !== undefined
            ? filters.openToRecruiter
            : openToRecruiter,
        openToMentor:
          filters.openToMentor !== undefined
            ? filters.openToMentor
            : openToMentor,
        onlyTalent:
          filters.onlyTalent !== undefined ? filters.onlyTalent : onlyTalent,
        onlyMentor:
          filters.onlyMentor !== undefined ? filters.onlyMentor : onlyMentor,
        onlyRecruiter:
          filters.onlyRecruiter !== undefined
            ? filters.onlyRecruiter
            : onlyRecruiter,
        // New "Open to" filters
        openToTalents:
          filters.openToTalents !== undefined
            ? filters.openToTalents
            : openToTalents,
      };

      if (isSearchTalent) {
        // For talent search
        if (currentFilters.onlyTalent) params.set("onlyTalent", "true");
        else params.delete("onlyTalent");
        if (currentFilters.onlyMentor) params.set("onlyMentor", "true");
        else params.delete("onlyMentor");
        if (currentFilters.onlyRecruiter) params.set("onlyRecruiter", "true");
        else params.delete("onlyRecruiter");
      } else {
        // For job search
        if (currentFilters.openToRecruiter) params.set("recruiter", "true");
        else params.delete("recruiter");
        if (currentFilters.openToMentor) params.set("mentor", "true");
        else params.delete("mentor");
      }

      // Handle new "Open to" filters for both job and talent search
      if (currentFilters.openToTalents) params.set("openToTalents", "true");
      else params.delete("openToTalents");

      const path = isSearchTalent
        ? "/companies/search-talents"
        : "/talents/job-search";

      router.replace(`${path}?${params.toString()}`);
    },
    [
      router,
      searchParams,
      isSearchTalent,
      openToRecruiter,
      openToMentor,
      onlyTalent,
      onlyMentor,
      onlyRecruiter,
      openToTalents,
    ],
  );

  // Debounce the search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Check if we have URL params that match current state (initial load scenario)
      const currentSearch = searchParams.get("search")?.split(",").map(s => s.trim()).filter(s => s) || [];
      const currentLocation = searchParams.get("location") || "";
      const currentName = searchParams.get("name") || "";
      
      // Only trigger search if values actually changed (not initial load)
      const searchChanged = JSON.stringify(selectedSkills.sort()) !== JSON.stringify(currentSearch.sort());
      const locationChanged = location !== currentLocation;
      const nameChanged = companyName !== currentName;
      
      if (searchChanged || locationChanged || nameChanged) {
        performSearch(selectedSkills, location, companyName, {}, true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedSkills, location, companyName, performSearch, searchParams]);

  const handleSearch = () => {
    // Immediate search when clicking button
    performSearch(selectedSkills, location, companyName);
  };

  const handleClearFilters = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedSkills([]);
    setLocation("");
    setCompanyName("");
    setOpenToRecruiter(false);
    setOpenToMentor(false);
    setOnlyTalent(false);
    setOnlyMentor(false);
    setOnlyRecruiter(false);
    setOpenToTalents(false);

    const path = isSearchTalent
      ? "/companies/search-talents"
      : "/talents/job-search";
    router.replace(path);
  };

  return (
    <div className="w-full">
      {/* Full width background wrapper */}
      <div className="w-full bg-gradient-to-r from-amber-50/80 via-yellow-50/60 to-amber-50/80 min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl mb-6 shadow-lg">
              {isSearchTalent ? (
                <Users className="w-8 h-8 text-white" />
              ) : (
                <Briefcase className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isSearchTalent
                ? "Find the perfect talent for your next project"
                : "Discover amazing opportunities in Web3 and blockchain"}
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-amber-100/50">
            {/* First Row - Search Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Side - Search Fields */}
              <div className="space-y-6">
                {/* Skills */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                    Skills & Technologies
                  </label>
                  <SkillsSuggestionMulti
                    placeholder="e.g. Solidity, React, Rust, Python..."
                    value={selectedSkills}
                    onSkillsChange={(skills) => setSelectedSkills(skills)}
                    classes="w-full rounded-xl border-2 border-amber-100 focus-within:border-amber-400 bg-white/80 text-gray-800 placeholder-gray-500 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  />
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Location
                  </label>
                  <CitySuggestion
                    classes="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:ring-0 bg-white/80 text-gray-800 placeholder-gray-500 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                    onCitySelect={(address: { name: string }) =>
                      setLocation(address.name)
                    }
                    value={location}
                    key={location}
                  />
                </div>

                {/* Company/Talent Name */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {isSearchTalent ? "Talent Name" : "Company Name"}
                  </label>
                  <Input
                    placeholder={
                      isSearchTalent
                        ? "Search by talent name..."
                        : "Search by company name..."
                    }
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    classes="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:ring-0 bg-white/80 text-gray-800 placeholder-gray-500 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  />
                </div>
              </div>

              {/* Right Side - Filters */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Advanced Filters
                  </label>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200/50">
                    <div className="space-y-4">
                      {!isSearchTalent ? (
                        // Job search filters
                        <>
                          <ToggleSwitch
                            id="openToRecruiter"
                            label="Open to Recruiters"
                            checked={openToRecruiter}
                            onChange={(checked) => {
                              setOpenToRecruiter(checked);
                              performSearch(selectedSkills, location, companyName, {
                                openToRecruiter: checked,
                              }, false);
                            }}
                          />
                          <ToggleSwitch
                            id="openToMentor"
                            label="Open to Mentors"
                            checked={openToMentor}
                            onChange={(checked) => {
                              setOpenToMentor(checked);
                              performSearch(selectedSkills, location, companyName, {
                                openToMentor: checked,
                              }, false);
                            }}
                          />
                          
                          {/* New "Open to" filters */}
                          <ToggleSwitch
                            id="openToTalents"
                            label="Open to Talents"
                            checked={openToTalents}
                            onChange={(checked) => {
                              setOpenToTalents(checked);
                              performSearch(selectedSkills, location, companyName, {
                                openToTalents: checked,
                              }, false);
                            }}
                          />
                        </>
                      ) : (
                        // Talent search filters
                        <>
                          <ToggleSwitch
                            id="onlyTalent"
                            label="Talent Only"
                            checked={onlyTalent}
                            onChange={(checked) => {
                              setOnlyTalent(checked);
                              performSearch(selectedSkills, location, companyName, {
                                onlyTalent: checked,
                              }, false);
                            }}
                          />
                          <ToggleSwitch
                            id="onlyMentor"
                            label="Mentor Only"
                            checked={onlyMentor}
                            onChange={(checked) => {
                              setOnlyMentor(checked);
                              performSearch(selectedSkills, location, companyName, {
                                onlyMentor: checked,
                              }, false);
                            }}
                          />
                          <ToggleSwitch
                            id="onlyRecruiter"
                            label="Recruiter Only"
                            checked={onlyRecruiter}
                            onChange={(checked) => {
                              setOnlyRecruiter(checked);
                              performSearch(selectedSkills, location, companyName, {
                                onlyRecruiter: checked,
                              }, false);
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-amber-100">
              <div className="flex flex-wrap items-center gap-3">
                <LinkButton
                  href="#"
                  icon={<FolderOpen className="w-4 h-4" />}
                  iconSize="medium"
                  variant="secondary"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </LinkButton>
              </div>

              <LinkButton
                href={
                  isSearchTalent
                    ? "/companies/create-job"
                    : "/talents/my-profile"
                }
                icon={isSearchTalent ? <Sparkles className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                iconSize="medium"
                variant="primary"
              >
                {isSearchTalent ? "Create Job" : "My Profile"}
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
