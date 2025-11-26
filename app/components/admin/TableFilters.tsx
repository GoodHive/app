"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Filter, Calendar } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "multiselect" | "date" | "daterange" | "text" | "status";
  options?: { value: string; label: string }[];
}

interface TableFiltersProps {
  filters: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

export function TableFilters({
  filters,
  onFilterChange,
  initialValues = {},
}: TableFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>(
    initialValues
  );

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) => activeFilters[key] !== null && activeFilters[key] !== undefined && activeFilters[key] !== ""
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[150px]">
            {filter.type === "select" && (
              <Select
                value={activeFilters[filter.key] || ""}
                onValueChange={(value) =>
                  handleFilterChange(filter.key, value || null)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {filter.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filter.type === "status" && (
              <Select
                value={activeFilters[filter.key] || ""}
                onValueChange={(value) =>
                  handleFilterChange(filter.key, value || null)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {filter.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filter.type === "daterange" && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`${filter.key}-start`} className="text-xs text-gray-600">
                    Start
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id={`${filter.key}-start`}
                      type="date"
                      value={activeFilters[`${filter.key}_start`] || ""}
                      onChange={(e) =>
                        handleFilterChange(`${filter.key}_start`, e.target.value || null)
                      }
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor={`${filter.key}-end`} className="text-xs text-gray-600">
                    End
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id={`${filter.key}-end`}
                      type="date"
                      value={activeFilters[`${filter.key}_end`] || ""}
                      onChange={(e) =>
                        handleFilterChange(`${filter.key}_end`, e.target.value || null)
                      }
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            )}
            {filter.type === "text" && (
              <input
                type="text"
                placeholder={filter.label}
                value={activeFilters[filter.key] || ""}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905]"
              />
            )}
          </div>
        ))}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-600"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (value === null || value === undefined || value === "") return null;
            
            // Handle date range filters (combine start and end)
            if (key.endsWith("_start") || key.endsWith("_end")) {
              const baseKey = key.replace(/_start$|_end$/, "");
              const startKey = `${baseKey}_start`;
              const endKey = `${baseKey}_end`;
              const startValue = activeFilters[startKey];
              const endValue = activeFilters[endKey];
              
              // Only show badge once for the date range
              if (key.endsWith("_end") || (key.endsWith("_start") && !activeFilters[endKey])) {
                const filter = filters.find((f) => f.key === baseKey);
                const dateRangeLabel = startValue && endValue
                  ? `${startValue} to ${endValue}`
                  : startValue
                  ? `From ${startValue}`
                  : `Until ${endValue}`;
                
                return (
                  <Badge
                    key={baseKey}
                    variant="secondary"
                    className="gap-2 px-3 py-1"
                  >
                    <span className="text-xs">
                      {filter?.label}: {dateRangeLabel}
                    </span>
                    <button
                      onClick={() => {
                        removeFilter(startKey);
                        removeFilter(endKey);
                      }}
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              }
              return null;
            }
            
            const filter = filters.find((f) => f.key === key);
            const label =
              filter?.options?.find((opt) => opt.value === value)?.label ||
              value;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="gap-2 px-3 py-1"
              >
                <span className="text-xs">
                  {filter?.label}: {label}
                </span>
                <button
                  onClick={() => removeFilter(key)}
                  className="hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

