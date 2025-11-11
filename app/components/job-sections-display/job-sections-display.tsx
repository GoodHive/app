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
    <div className="border border-yellow-200 rounded-xl mb-6 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-yellow-400">
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#fef5cf] transition-all duration-300 border-b border-yellow-100"
        onClick={handleToggle}
      >
        <h3 className="text-xl font-semibold text-gray-900 flex-1 leading-tight">
          {section.heading}
        </h3>
        <div className="ml-4 p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition-colors">
          {expanded ? (
            <ChevronUpIcon className="w-5 h-5 text-yellow-700" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-yellow-700" />
          )}
        </div>
      </div>

      {/* Section Content */}
      {expanded && (
        <div className="px-6 pb-6 pt-4 bg-[#fef5cf]/30">
          <div
            className="prose prose-lg max-w-none text-gray-700 job-section-content leading-relaxed"
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
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={expandAll}
            className="text-sm font-medium text-yellow-600 hover:text-yellow-800 hover:bg-[#fef5cf] transition-all duration-200 px-3 py-2 rounded-lg border border-yellow-200 hover:border-yellow-400"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-sm font-medium text-yellow-600 hover:text-yellow-800 hover:bg-[#fef5cf] transition-all duration-200 px-3 py-2 rounded-lg border border-yellow-200 hover:border-yellow-400"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* Job Sections */}
      <div className="space-y-4">
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