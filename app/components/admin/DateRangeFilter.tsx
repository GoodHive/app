"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  label?: string;
}

export function DateRangeFilter({
  onDateRangeChange,
  initialStartDate = null,
  initialEndDate = null,
  label = "Date Range",
}: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState<string>(initialStartDate || "");
  const [endDate, setEndDate] = useState<string>(initialEndDate || "");

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    onDateRangeChange(value || null, endDate || null);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    onDateRangeChange(startDate || null, value || null);
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange(null, null);
  };

  const hasActiveFilter = startDate || endDate;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 min-w-[200px]">
        <div className="relative flex-1">
          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="date"
            placeholder="Start date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <span className="text-gray-400">to</span>
        <div className="relative flex-1">
          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="date"
            placeholder="End date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearDates}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {hasActiveFilter && (
        <Badge variant="secondary" className="gap-1">
          {startDate && endDate
            ? `${startDate} - ${endDate}`
            : startDate
            ? `From ${startDate}`
            : `Until ${endDate}`}
        </Badge>
      )}
    </div>
  );
}
