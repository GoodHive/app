"use client";

import { IJobSection } from "@/interfaces/job-offer";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";

interface JobSectionDisplayProps {
  section: IJobSection;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const JobSectionDisplay: React.FC<JobSectionDisplayProps> = ({
  section,
  isExpanded = true,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);

  const expanded = onToggle ? isExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  return (
    <div className="border border-gray-200 rounded-lg mb-4 bg-white overflow-hidden">
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
      >
        <h3 className="text-lg font-semibold text-gray-800 flex-1">
          {section.heading}
        </h3>
        <div className="ml-4">
          {expanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {/* Section Content */}
      {expanded && (
        <div className="px-4 pb-4">
          <div
            className="prose max-w-none text-gray-700 job-section-content"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </div>
      )}
    </div>
  );
};

interface JobSectionsDisplayProps {
  sections: IJobSection[];
  defaultExpanded?: boolean;
  className?: string;
}

export const JobSectionsDisplay: React.FC<JobSectionsDisplayProps> = ({
  sections,
  defaultExpanded = false,
  className = "",
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    defaultExpanded
      ? new Set(sections.map((_, index) => index))
      : new Set([0]) // Expand first section by default
  );

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((_, index) => index)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  if (!sections || sections.length === 0) {
    return (
      <div className={`text-gray-500 text-center py-8 ${className}`}>
        <p>No job description sections available.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Control buttons - only show if there are multiple sections */}
      {sections.length > 1 && (
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* Job Sections */}
      <div className="space-y-3">
        {sections
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((section, index) => (
            <JobSectionDisplay
              key={section.id || index}
              section={section}
              isExpanded={expandedSections.has(index)}
              onToggle={() => toggleSection(index)}
            />
          ))}
      </div>
    </div>
  );
};

export default JobSectionsDisplay;