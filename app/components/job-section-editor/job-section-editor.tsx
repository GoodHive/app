"use client";

import { IJobSection } from "@/interfaces/job-offer";
import { TrashIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import "react-quill/dist/quill.snow.css";
import "@/app/styles/job-sections.css";

// Dynamically import React Quill to prevent server-side rendering issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Define Quill modules and formats for job sections
const quillModules = {
  toolbar: [
    [{ header: [2, 3, 4, false] }], // Limited header levels for sections
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

interface JobSectionEditorProps {
  section: IJobSection;
  onUpdate: (section: IJobSection) => void;
  onDelete: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dragHandleProps?: any; // For drag and drop functionality
}

export const JobSectionEditor: React.FC<JobSectionEditorProps> = ({
  section,
  onUpdate,
  onDelete,
  isCollapsed,
  onToggleCollapse,
  dragHandleProps,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...section,
      heading: e.target.value,
    });
  };

  const handleContentChange = (content: string) => {
    onUpdate({
      ...section,
      content,
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      setIsDeleting(true);
      onDelete();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="drag-handle"
            >
              <circle cx="3" cy="3" r="1" />
              <circle cx="3" cy="8" r="1" />
              <circle cx="3" cy="13" r="1" />
              <circle cx="8" cy="3" r="1" />
              <circle cx="8" cy="8" r="1" />
              <circle cx="8" cy="13" r="1" />
            </svg>
          </div>

          {/* Section Title Display */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {section.heading || "Untitled Section"}
            </h3>
            {isCollapsed && section.content && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {section.content.replace(/<[^>]*>/g, "").substring(0, 100)}
                {section.content.length > 100 ? "..." : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            title="Delete section"
          >
            <TrashIcon className="w-5 h-5" />
          </button>

          {/* Collapse/Expand Arrow */}
          <div
            className={`transform transition-transform duration-200 ${
              isCollapsed ? "" : "rotate-180"
            }`}
          >
            <svg
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 20 20"
              className="text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Section Content (when expanded) */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Heading Input */}
          <div>
            <label
              htmlFor={`section-heading-${section.sort_order}`}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Section Heading*
            </label>
            <input
              id={`section-heading-${section.sort_order}`}
              type="text"
              value={section.heading}
              onChange={handleHeadingChange}
              placeholder="e.g., About the Role, What You'll Do, Benefits..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC905] focus:border-[#FFC905] outline-none transition-colors"
              maxLength={255}
            />
          </div>

          {/* Content Editor */}
          <div>
            <label
              htmlFor={`section-content-${section.sort_order}`}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content*
            </label>
            <div style={{ borderRadius: "8px", overflow: "hidden" }}>
              <ReactQuill
                theme="snow"
                modules={quillModules}
                value={section.content}
                onChange={handleContentChange}
                placeholder="Describe this section of the job..."
                className="quill-editor job-section-editor"
                style={{
                  fontSize: "1rem",
                  minHeight: "150px",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSectionEditor;