"use client";

import { Dialog, Listbox, Popover, Transition } from "@headlessui/react";
import clsx from "clsx";
import {
  ChevronDown,
  Filter,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { jobTypes, typeEngagements } from "@/app/constants/common";
import type { SearchFiltersProps } from "./search-filters.types";

import styles from "./search-filters.module.scss";

const DATE_POSTED_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "1d", label: "Past 24 hours" },
  { value: "3d", label: "Past 3 days" },
  { value: "7d", label: "Past week" },
  { value: "14d", label: "Past 2 weeks" },
  { value: "30d", label: "Past month" },
];

const BUDGET_OPTIONS = [
  { value: "0-1000", label: "Under $1k" },
  { value: "1000-5000", label: "$1k – $5k" },
  { value: "5000-10000", label: "$5k – $10k" },
  { value: "10000-25000", label: "$10k – $25k" },
  { value: "25000-", label: "$25k+" },
];

const JOB_SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "budget_high", label: "Budget: High to Low" },
  { value: "budget_low", label: "Budget: Low to High" },
];

const TALENT_SORT_OPTIONS = [
  { value: "recent", label: "Recently active" },
  { value: "alphabetical", label: "Name A → Z" },
  { value: "rate_high", label: "Rate: High to Low" },
  { value: "rate_low", label: "Rate: Low to High" },
];

const JOB_TYPE_OPTIONS = [
  { value: "all", label: "All job types" },
  ...jobTypes,
];

const ENGAGEMENT_OPTIONS = [
  { value: "any", label: "Any engagement" },
  ...typeEngagements.filter((option) => option.value !== "any"),
];

type FilterUpdates = {
  keywords?: string;
  location?: string;
  name?: string;
  datePosted?: string;
  jobType?: string;
  engagement?: string;
  budgetRange?: string;
  openToRecruiter?: boolean;
  openToMentor?: boolean;
  openToTalents?: boolean;
  sort?: string;
  onlyTalent?: boolean;
  onlyMentor?: boolean;
  onlyRecruiter?: boolean;
  availability?: boolean;
  remoteOnly?: boolean;
  freelanceOnly?: boolean;
};

type SortOption = {
  value: string;
  label: string;
};

type FilterChipProps = {
  label: string;
  active?: boolean;
  children: (close: () => void) => ReactNode;
};

const FilterChip = ({ label, active = false, children }: FilterChipProps) => (
  <Popover className={styles.filterChip}>
    {({ open, close }) => (
      <>
        <Popover.Button
          className={clsx(
            styles.chipButton,
            (open || active) && styles.chipButtonActive,
          )}
        >
          <span>{label}</span>
          <ChevronDown className={styles.chipCaret} />
        </Popover.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel className={styles.chipPanel}>
            {children(close)}
          </Popover.Panel>
        </Transition>
      </>
    )}
  </Popover>
);

type SortSelectProps = {
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
};

const SortSelect = ({ value, options, onChange }: SortSelectProps) => (
  <Listbox value={value} onChange={onChange}>
    <div className={styles.sortSelect}>
      <Listbox.Button className={styles.sortSelectButton}>
        <SlidersHorizontal className={styles.chipCaret} />
        <span>
          {options.find((option) => option.value === value)?.label ?? "Sort"}
        </span>
        <ChevronDown className={styles.chipCaret} />
      </Listbox.Button>
      <Transition
        as={Fragment}
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
      >
        <Listbox.Options className={styles.sortSelectOptions}>
          {options.map((option) => (
            <Listbox.Option key={option.value} value={option.value}>
              {({ active, selected }) => (
                <div
                  className={clsx(
                    styles.sortSelectOption,
                    active && styles.sortSelectOptionActive,
                    selected && styles.sortSelectOptionActive,
                  )}
                >
                  <span>{option.label}</span>
                  {selected && <span className={styles.sortSelectIndicator} />}
                </div>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Transition>
    </div>
  </Listbox>
);

const ChipOptionButton = ({
  active,
  label,
  description,
  onSelect,
}: {
  active: boolean;
  label: string;
  description?: string;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={clsx(styles.chipOption, active && styles.chipOptionActive)}
  >
    <span>{label}</span>
    {description && (
      <span className={styles.chipOptionDescription}>{description}</span>
    )}
  </button>
);

const ChipToggle = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={clsx(styles.chipToggle, checked && styles.chipToggleActive)}
  >
    <span>{label}</span>
    <span className={styles.chipToggleIndicator} />
  </button>
);

export const SearchFilters = ({
  isSearchTalent = false,
}: SearchFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultSort = isSearchTalent ? "recent" : "latest";
  const basePath = isSearchTalent
    ? "/companies/search-talents"
    : "/talents/job-search";

  const [keywordQuery, setKeywordQuery] = useState("");
  const [location, setLocation] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [datePosted, setDatePosted] = useState("any");
  const [jobType, setJobType] = useState("all");
  const [engagement, setEngagement] = useState("any");
  const [budgetRange, setBudgetRange] = useState("");
  const [openToRecruiter, setOpenToRecruiter] = useState(false);
  const [openToMentor, setOpenToMentor] = useState(false);
  const [openToTalents, setOpenToTalents] = useState(false);
  const [onlyTalent, setOnlyTalent] = useState(false);
  const [onlyMentor, setOnlyMentor] = useState(false);
  const [onlyRecruiter, setOnlyRecruiter] = useState(false);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [remoteOnlyPreference, setRemoteOnlyPreference] = useState(false);
  const [freelanceOnlyPreference, setFreelanceOnlyPreference] = useState(false);
  const [sortOrder, setSortOrder] = useState(defaultSort);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const searchParam = searchParams.get("search") || "";
    setKeywordQuery(searchParam);

    setLocation(searchParams.get("location") || "");
    setNameQuery(searchParams.get("name") || "");

    setDatePosted(searchParams.get("datePosted") || "any");
    setJobType(searchParams.get("jobType") || "all");
    setEngagement(searchParams.get("engagement") || "any");
    setBudgetRange(searchParams.get("budgetRange") || "");

    const recruiterParam =
      searchParams.get("openToRecruiter") ?? searchParams.get("recruiter");
    setOpenToRecruiter(recruiterParam === "true");
    setOpenToMentor(searchParams.get("mentor") === "true");
    setOpenToTalents(searchParams.get("openToTalents") === "true");

    setOnlyTalent(searchParams.get("onlyTalent") === "true");
    setOnlyMentor(searchParams.get("onlyMentor") === "true");
    setOnlyRecruiter(searchParams.get("onlyRecruiter") === "true");

    setAvailabilityOnly(searchParams.get("availability") === "true");
    setRemoteOnlyPreference(searchParams.get("remoteOnly") === "true");
    setFreelanceOnlyPreference(searchParams.get("freelanceOnly") === "true");

    setSortOrder(searchParams.get("sort") || defaultSort);
  }, [searchParams, defaultSort]);

  const applyFilters = useCallback(
    (updates: FilterUpdates = {}, options: { resetPage?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      const shouldResetPage = options.resetPage !== false;

      // Preserve items parameter if it exists
      const currentItems = searchParams.get("items");

      if (shouldResetPage) {
        params.delete("page");
      }

      // Ensure items parameter is preserved
      if (currentItems) {
        params.set("items", currentItems);
      }

      const nextKeywords =
        updates.keywords !== undefined ? updates.keywords : keywordQuery;
      if (nextKeywords.trim()) {
        params.set("search", nextKeywords.trim());
      } else {
        params.delete("search");
      }

      const nextLocation = updates.location ?? location;
      if (nextLocation.trim()) {
        params.set("location", nextLocation.trim());
      } else {
        params.delete("location");
      }

      const nextName = updates.name ?? nameQuery;
      if (nextName.trim()) {
        params.set("name", nextName.trim());
      } else {
        params.delete("name");
      }

      const nextSort = updates.sort ?? sortOrder ?? defaultSort;
      if (nextSort && nextSort !== defaultSort) {
        params.set("sort", nextSort);
      } else {
        params.delete("sort");
      }

      if (!isSearchTalent) {
        const nextDatePosted = updates.datePosted ?? datePosted;
        if (nextDatePosted && nextDatePosted !== "any") {
          params.set("datePosted", nextDatePosted);
        } else {
          params.delete("datePosted");
        }

        const nextJobType = updates.jobType ?? jobType;
        if (nextJobType && nextJobType !== "all") {
          params.set("jobType", nextJobType);
        } else {
          params.delete("jobType");
        }

        const nextEngagement = updates.engagement ?? engagement;
        if (nextEngagement && nextEngagement !== "any") {
          params.set("engagement", nextEngagement);
        } else {
          params.delete("engagement");
        }

        const nextBudget = updates.budgetRange ?? budgetRange;
        if (nextBudget) {
          params.set("budgetRange", nextBudget);
        } else {
          params.delete("budgetRange");
        }

        const nextRecruiter = updates.openToRecruiter ?? openToRecruiter;
        if (nextRecruiter) {
          params.set("openToRecruiter", "true");
        } else {
          params.delete("openToRecruiter");
        }

        const nextMentor = updates.openToMentor ?? openToMentor;
        if (nextMentor) {
          params.set("mentor", "true");
        } else {
          params.delete("mentor");
        }

        const nextTalents = updates.openToTalents ?? openToTalents;
        if (nextTalents) {
          params.set("openToTalents", "true");
        } else {
          params.delete("openToTalents");
        }
      } else {
        const nextOnlyTalent = updates.onlyTalent ?? onlyTalent;
        if (nextOnlyTalent) {
          params.set("onlyTalent", "true");
        } else {
          params.delete("onlyTalent");
        }

        const nextOnlyMentor = updates.onlyMentor ?? onlyMentor;
        if (nextOnlyMentor) {
          params.set("onlyMentor", "true");
        } else {
          params.delete("onlyMentor");
        }

        const nextOnlyRecruiter = updates.onlyRecruiter ?? onlyRecruiter;
        if (nextOnlyRecruiter) {
          params.set("onlyRecruiter", "true");
        } else {
          params.delete("onlyRecruiter");
        }

        const nextAvailability = updates.availability ?? availabilityOnly;
        if (nextAvailability) {
          params.set("availability", "true");
        } else {
          params.delete("availability");
        }

        const nextRemote = updates.remoteOnly ?? remoteOnlyPreference;
        if (nextRemote) {
          params.set("remoteOnly", "true");
        } else {
          params.delete("remoteOnly");
        }

        const nextFreelance = updates.freelanceOnly ?? freelanceOnlyPreference;
        if (nextFreelance) {
          params.set("freelanceOnly", "true");
        } else {
          params.delete("freelanceOnly");
        }
      }

      const query = params.toString();
      router.replace(query ? `${basePath}?${query}` : basePath, {
        scroll: false,
      });
    },
    [
      availabilityOnly,
      basePath,
      budgetRange,
      datePosted,
      defaultSort,
      engagement,
      freelanceOnlyPreference,
      isSearchTalent,
      jobType,
      keywordQuery,
      location,
      nameQuery,
      onlyMentor,
      onlyRecruiter,
      onlyTalent,
      openToMentor,
      openToRecruiter,
      openToTalents,
      remoteOnlyPreference,
      router,
      searchParams,
      sortOrder,
    ],
  );

  const handleSearchSubmit = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      applyFilters({});
    },
    [applyFilters],
  );

  // Debounced live search for keywords
  useEffect(() => {
    const handle = setTimeout(() => {
      // Only apply if keywords actually changed from URL params
      const currentKeywords = searchParams.get("search") || "";
      if (keywordQuery !== currentKeywords) {
        applyFilters({ keywords: keywordQuery });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [keywordQuery, applyFilters, searchParams]);

  const handleClearFilters = useCallback(() => {
    setKeywordQuery("");
    setLocation("");
    setNameQuery("");
    setDatePosted("any");
    setJobType("all");
    setEngagement("any");
    setBudgetRange("");
    setOpenToRecruiter(false);
    setOpenToMentor(false);
    setOpenToTalents(false);
    setOnlyTalent(false);
    setOnlyMentor(false);
    setOnlyRecruiter(false);
    setAvailabilityOnly(false);
    setRemoteOnlyPreference(false);
    setFreelanceOnlyPreference(false);
    setSortOrder(defaultSort);
    setIsDrawerOpen(false);
    router.replace(basePath, { scroll: false });
  }, [basePath, defaultSort, router]);

  const hasActiveFilters = useMemo(() => {
    const baseActive =
      Boolean(keywordQuery.trim()) ||
      Boolean(location.trim()) ||
      Boolean(nameQuery.trim());

    const jobActive =
      !isSearchTalent &&
      (datePosted !== "any" ||
        jobType !== "all" ||
        engagement !== "any" ||
        Boolean(budgetRange) ||
        openToRecruiter ||
        openToMentor ||
        openToTalents);

    const talentActive =
      isSearchTalent &&
      (onlyTalent ||
        onlyMentor ||
        onlyRecruiter ||
        availabilityOnly ||
        remoteOnlyPreference ||
        freelanceOnlyPreference);

    const sortActive = sortOrder !== defaultSort;

    return baseActive || jobActive || talentActive || sortActive;
  }, [
    availabilityOnly,
    budgetRange,
    datePosted,
    defaultSort,
    engagement,
    freelanceOnlyPreference,
    isSearchTalent,
    jobType,
    keywordQuery,
    location,
    nameQuery,
    onlyMentor,
    onlyRecruiter,
    onlyTalent,
    openToMentor,
    openToRecruiter,
    openToTalents,
    remoteOnlyPreference,
    sortOrder,
  ]);

  const handleSortChange = useCallback(
    (value: string) => {
      setSortOrder(value);
      applyFilters({ sort: value }, { resetPage: false });
    },
    [applyFilters],
  );

  const handleDatePostedChange = useCallback(
    (value: string, close?: () => void) => {
      setDatePosted(value);
      applyFilters({ datePosted: value });
      close?.();
    },
    [applyFilters],
  );

  const handleJobTypeChange = useCallback(
    (value: string, close?: () => void) => {
      setJobType(value);
      applyFilters({ jobType: value });
      close?.();
    },
    [applyFilters],
  );

  const handleEngagementChange = useCallback(
    (value: string, close?: () => void) => {
      setEngagement(value);
      applyFilters({ engagement: value });
      close?.();
    },
    [applyFilters],
  );

  const handleBudgetChange = useCallback(
    (value: string, close?: () => void) => {
      setBudgetRange(value);
      applyFilters({ budgetRange: value });
      close?.();
    },
    [applyFilters],
  );

  const handleOpenToRecruiterChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setOpenToRecruiter(checked);
      applyFilters({ openToRecruiter: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleOpenToMentorChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setOpenToMentor(checked);
      applyFilters({ openToMentor: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleOpenToTalentsChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setOpenToTalents(checked);
      applyFilters({ openToTalents: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleOnlyTalentChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setOnlyTalent(checked);
      applyFilters({ onlyTalent: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleOnlyMentorChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setOnlyMentor(checked);
      applyFilters({ onlyMentor: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleOnlyRecruiterChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setOnlyRecruiter(checked);
      applyFilters({ onlyRecruiter: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleAvailabilityChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setAvailabilityOnly(checked);
      applyFilters({ availability: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleRemotePreferenceChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setRemoteOnlyPreference(checked);
      applyFilters({ remoteOnly: checked });
      close?.();
    },
    [applyFilters],
  );

  const handleFreelancePreferenceChange = useCallback(
    (checked: boolean, close?: () => void) => {
      setFreelanceOnlyPreference(checked);
      applyFilters({ freelanceOnly: checked });
      close?.();
    },
    [applyFilters],
  );

  const jobSortOptions = JOB_SORT_OPTIONS;
  const talentSortOptions = TALENT_SORT_OPTIONS;

  return (
    <div className={styles.wrapper}>
      <div className={styles.shell}>
        <div className={styles.inner}>
          <form onSubmit={handleSearchSubmit} className={styles.form}>
            <div className={styles.fieldColumns}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>What</span>
                <div className={styles.fieldControl}>
                  <SearchIcon className={styles.fieldIcon} />
                  <input
                    type="text"
                    value={keywordQuery}
                    onChange={(e) => setKeywordQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyFilters({ keywords: keywordQuery });
                      }
                    }}
                    placeholder="Job title, skill, company or keyword"
                    name="keywords"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Search keywords"
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-lpignore="true"
                    data-form-type="other"
                    className={styles.locationInput}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Where</span>
                <div className={styles.fieldControl}>
                  <MapPin className={styles.fieldIcon} />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyFilters({ location });
                      }
                    }}
                    placeholder="City, state, or country"
                    name="location"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Search location"
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-lpignore="true"
                    data-form-type="other"
                    className={styles.locationInput}
                  />
                </div>
              </div>
            </div>

            {/* Search button removed per design: submit via Enter or filter changes */}
          </form>

          <div className={styles.chipRow}>
            {!isSearchTalent && (
              <>
                <FilterChip label="Date posted" active={datePosted !== "any"}>
                  {(close) => (
                    <div className={styles.panelList}>
                      {DATE_POSTED_OPTIONS.map((option) => (
                        <ChipOptionButton
                          key={option.value}
                          label={option.label}
                          active={datePosted === option.value}
                          onSelect={() =>
                            handleDatePostedChange(option.value, close)
                          }
                        />
                      ))}
                    </div>
                  )}
                </FilterChip>

                <FilterChip label="Job type" active={jobType !== "all"}>
                  {(close) => (
                    <div className={styles.panelList}>
                      {JOB_TYPE_OPTIONS.map((option) => (
                        <ChipOptionButton
                          key={option.value}
                          label={option.label}
                          active={jobType === option.value}
                          onSelect={() =>
                            handleJobTypeChange(option.value, close)
                          }
                        />
                      ))}
                    </div>
                  )}
                </FilterChip>

                <FilterChip label="Engagement" active={engagement !== "any"}>
                  {(close) => (
                    <div className={styles.panelList}>
                      {ENGAGEMENT_OPTIONS.map((option) => (
                        <ChipOptionButton
                          key={option.value}
                          label={option.label}
                          active={engagement === option.value}
                          onSelect={() =>
                            handleEngagementChange(option.value, close)
                          }
                        />
                      ))}
                    </div>
                  )}
                </FilterChip>

                <FilterChip label="Budget" active={Boolean(budgetRange)}>
                  {(close) => (
                    <div className={styles.panelList}>
                      {BUDGET_OPTIONS.map((option) => (
                        <ChipOptionButton
                          key={option.value}
                          label={option.label}
                          active={budgetRange === option.value}
                          onSelect={() =>
                            handleBudgetChange(option.value, close)
                          }
                        />
                      ))}
                      {budgetRange && (
                        <ChipOptionButton
                          label="Any budget"
                          active={budgetRange === ""}
                          onSelect={() => handleBudgetChange("", close)}
                        />
                      )}
                    </div>
                  )}
                </FilterChip>

                <FilterChip
                  label="Open to"
                  active={openToRecruiter || openToMentor || openToTalents}
                >
                  {(close) => (
                    <div className={styles.panelList}>
                      <ChipToggle
                        checked={openToRecruiter}
                        label="Recruiters"
                        onChange={(value) => handleOpenToRecruiterChange(value)}
                      />
                      <ChipToggle
                        checked={openToMentor}
                        label="Mentors"
                        onChange={(value) => handleOpenToMentorChange(value)}
                      />
                      <ChipToggle
                        checked={openToTalents}
                        label="Talents"
                        onChange={(value) => handleOpenToTalentsChange(value)}
                      />
                      <button
                        type="button"
                        className={styles.chipClearLink}
                        onClick={() => {
                          handleOpenToRecruiterChange(false);
                          handleOpenToMentorChange(false);
                          handleOpenToTalentsChange(false);
                          close();
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </FilterChip>
              </>
            )}

            {isSearchTalent && (
              <>
                <FilterChip
                  label="Role"
                  active={onlyTalent || onlyMentor || onlyRecruiter}
                >
                  {(close) => (
                    <div className={styles.panelList}>
                      <ChipToggle
                        checked={onlyTalent}
                        label="Talent"
                        onChange={(value) => handleOnlyTalentChange(value)}
                      />
                      <ChipToggle
                        checked={onlyMentor}
                        label="Mentor"
                        onChange={(value) => handleOnlyMentorChange(value)}
                      />
                      <ChipToggle
                        checked={onlyRecruiter}
                        label="Recruiter"
                        onChange={(value) => handleOnlyRecruiterChange(value)}
                      />
                      <button
                        type="button"
                        className={styles.chipClearLink}
                        onClick={() => {
                          handleOnlyTalentChange(false);
                          handleOnlyMentorChange(false);
                          handleOnlyRecruiterChange(false);
                          close();
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </FilterChip>

                <FilterChip label="Availability" active={availabilityOnly}>
                  {(close) => (
                    <div className={styles.panelList}>
                      <ChipToggle
                        checked={availabilityOnly}
                        label="Available now"
                        onChange={(value) => handleAvailabilityChange(value)}
                      />
                      {availabilityOnly && (
                        <button
                          type="button"
                          className={styles.chipClearLink}
                          onClick={() => handleAvailabilityChange(false, close)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </FilterChip>

                <FilterChip
                  label="Work preference"
                  active={remoteOnlyPreference || freelanceOnlyPreference}
                >
                  {(close) => (
                    <div className={styles.panelList}>
                      <ChipToggle
                        checked={remoteOnlyPreference}
                        label="Remote only"
                        onChange={(value) =>
                          handleRemotePreferenceChange(value)
                        }
                      />
                      <ChipToggle
                        checked={freelanceOnlyPreference}
                        label="Freelance only"
                        onChange={(value) =>
                          handleFreelancePreferenceChange(value)
                        }
                      />
                      <button
                        type="button"
                        className={styles.chipClearLink}
                        onClick={() => {
                          handleRemotePreferenceChange(false);
                          handleFreelancePreferenceChange(false);
                          close();
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </FilterChip>
              </>
            )}

            <button
              type="button"
              className={styles.allFiltersButton}
              onClick={() => setIsDrawerOpen(true)}
            >
              <Filter className={styles.chipCaret} />
              All filters
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearFilters}
              >
                <XCircle className={styles.chipCaret} />
                Clear
              </button>
            )}

            <SortSelect
              value={sortOrder}
              onChange={handleSortChange}
              options={isSearchTalent ? talentSortOptions : jobSortOptions}
            />
          </div>
        </div>
      </div>

      <Transition show={isDrawerOpen} as={Fragment}>
        <Dialog
          as="div"
          className={styles.drawerRoot}
          onClose={setIsDrawerOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className={styles.drawerOverlay} />
          </Transition.Child>

          <div className={styles.drawerViewport}>
            <div className={styles.drawerViewportInner}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-x-10 lg:-translate-x-10"
                enterTo="opacity-100 translate-x-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 translate-x-10 lg:-translate-x-10"
              >
                <Dialog.Panel className={styles.drawerPanel}>
                  <div className={styles.drawerHeader}>
                    <div>
                      <Dialog.Title className={styles.drawerTitle}>
                        Refine your results
                      </Dialog.Title>
                      <Dialog.Description className={styles.drawerDescription}>
                        Combine filters to surface the most relevant matches.
                      </Dialog.Description>
                    </div>
                    <button
                      type="button"
                      className={styles.drawerCloseButton}
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <XCircle className={styles.chipCaret} />
                    </button>
                  </div>

                  <div className={styles.drawerContent}>
                    <div className={styles.tipsCard}>
                      <h3 className={styles.tipsTitle}>Power tips</h3>
                      <div className={styles.tipsList}>
                        <span>
                          • Combine date and role filters to find fresh matches.
                        </span>
                        <span>
                          • Use the name filter to jump straight to a company or
                          talent.
                        </span>
                        <span>
                          • Fine-tune the sort order once filters are set.
                        </span>
                      </div>
                    </div>

                    <div className={styles.drawerFilters}>
                      <div className={styles.drawerFieldGroup}>
                        <label className={styles.drawerFieldLabel}>
                          {isSearchTalent ? "Talent name" : "Company name"}
                        </label>
                        <input
                          type="text"
                          value={nameQuery}
                          onChange={(event) => setNameQuery(event.target.value)}
                          onBlur={() =>
                            applyFilters(
                              { name: nameQuery },
                              { resetPage: false },
                            )
                          }
                          placeholder={
                            isSearchTalent
                              ? "Search by talent name"
                              : "Search by company name"
                          }
                          className={styles.drawerInput}
                        />
                      </div>

                      {!isSearchTalent ? (
                        <div className={styles.drawerGridTwo}>
                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Date posted
                            </label>
                            <div className={styles.panelList}>
                              {DATE_POSTED_OPTIONS.map((option) => (
                                <ChipOptionButton
                                  key={option.value}
                                  label={option.label}
                                  active={datePosted === option.value}
                                  onSelect={() =>
                                    handleDatePostedChange(option.value)
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Job type
                            </label>
                            <div className={styles.panelList}>
                              {JOB_TYPE_OPTIONS.map((option) => (
                                <ChipOptionButton
                                  key={option.value}
                                  label={option.label}
                                  active={jobType === option.value}
                                  onSelect={() =>
                                    handleJobTypeChange(option.value)
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Engagement
                            </label>
                            <div className={styles.panelList}>
                              {ENGAGEMENT_OPTIONS.map((option) => (
                                <ChipOptionButton
                                  key={option.value}
                                  label={option.label}
                                  active={engagement === option.value}
                                  onSelect={() =>
                                    handleEngagementChange(option.value)
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Budget range
                            </label>
                            <div className={styles.panelList}>
                              {BUDGET_OPTIONS.map((option) => (
                                <ChipOptionButton
                                  key={option.value}
                                  label={option.label}
                                  active={budgetRange === option.value}
                                  onSelect={() =>
                                    handleBudgetChange(option.value)
                                  }
                                />
                              ))}
                              <ChipOptionButton
                                label="Any budget"
                                active={budgetRange === ""}
                                onSelect={() => handleBudgetChange("")}
                              />
                            </div>
                          </div>

                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Open to
                            </label>
                            <div className={styles.panelList}>
                              <ChipToggle
                                checked={openToRecruiter}
                                label="Recruiters"
                                onChange={handleOpenToRecruiterChange}
                              />
                              <ChipToggle
                                checked={openToMentor}
                                label="Mentors"
                                onChange={handleOpenToMentorChange}
                              />
                              <ChipToggle
                                checked={openToTalents}
                                label="Talents"
                                onChange={handleOpenToTalentsChange}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.drawerGridTwo}>
                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Role focus
                            </label>
                            <div className={styles.panelList}>
                              <ChipToggle
                                checked={onlyTalent}
                                label="Talent"
                                onChange={handleOnlyTalentChange}
                              />
                              <ChipToggle
                                checked={onlyMentor}
                                label="Mentor"
                                onChange={handleOnlyMentorChange}
                              />
                              <ChipToggle
                                checked={onlyRecruiter}
                                label="Recruiter"
                                onChange={handleOnlyRecruiterChange}
                              />
                            </div>
                          </div>

                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Availability
                            </label>
                            <ChipToggle
                              checked={availabilityOnly}
                              label="Available now"
                              onChange={handleAvailabilityChange}
                            />
                          </div>

                          <div className={styles.drawerFieldGroup}>
                            <label className={styles.drawerFieldLabel}>
                              Work preference
                            </label>
                            <div className={styles.panelList}>
                              <ChipToggle
                                checked={remoteOnlyPreference}
                                label="Remote only"
                                onChange={handleRemotePreferenceChange}
                              />
                              <ChipToggle
                                checked={freelanceOnlyPreference}
                                label="Freelance only"
                                onChange={handleFreelancePreferenceChange}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.drawerActionBar}>
                    <button
                      type="button"
                      className={styles.resetButton}
                      onClick={handleClearFilters}
                    >
                      Reset filters
                    </button>
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={() => {
                        applyFilters({ name: nameQuery });
                        setIsDrawerOpen(false);
                      }}
                    >
                      Show results
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
