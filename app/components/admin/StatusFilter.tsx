"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StatusOption {
  value: string;
  label: string;
  color?: string;
}

interface StatusFilterProps {
  options: StatusOption[];
  onStatusChange: (status: string | null) => void;
  initialStatus?: string | null;
  label?: string;
  placeholder?: string;
}

export function StatusFilter({
  options,
  onStatusChange,
  initialStatus = null,
  label = "Status",
  placeholder = "All Statuses",
}: StatusFilterProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    initialStatus || ""
  );

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    onStatusChange(value || null);
  };

  const clearStatus = () => {
    setSelectedStatus("");
    onStatusChange(null);
  };

  const selectedOption = options.find((opt) => opt.value === selectedStatus);

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedStatus && (
        <>
          <Badge
            variant="secondary"
            className="gap-2"
            style={
              selectedOption?.color
                ? { backgroundColor: `${selectedOption.color}20`, color: selectedOption.color }
                : {}
            }
          >
            {selectedOption?.label || selectedStatus}
            <button
              onClick={clearStatus}
              className="hover:bg-gray-200 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </>
      )}
    </div>
  );
}

