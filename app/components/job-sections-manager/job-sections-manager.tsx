"use client";

import { IJobSection } from "@/interfaces/job-offer";
import { PlusIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import JobSectionEditor from "../job-section-editor/job-section-editor";

// Sortable wrapper for JobSectionEditor
interface SortableJobSectionProps {
  section: IJobSection;
  onUpdate: (section: IJobSection) => void;
  onDelete: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SortableJobSection: React.FC<SortableJobSectionProps> = ({
  section,
  onUpdate,
  onDelete,
  isCollapsed,
  onToggleCollapse,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.sort_order.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <JobSectionEditor
        section={section}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

interface JobSectionsManagerProps {
  sections: IJobSection[];
  onSectionsChange: (sections: IJobSection[]) => void;
}

const DEFAULT_SECTION_TEMPLATES = [
  "About the Role",
  "What You'll Do",
  "Your DNA",
  "Requirements",
  "Benefits",
  "About the Company",
  "The Team",
  "Next Steps",
];

export const JobSectionsManager: React.FC<JobSectionsManagerProps> = ({
  sections,
  onSectionsChange,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set()
  );
  const [showTemplates, setShowTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create a new section
  const addSection = (heading: string = "") => {
    const newSection: IJobSection = {
      heading,
      content: "",
      sort_order: sections.length,
    };

    const updatedSections = [...sections, newSection];
    onSectionsChange(updatedSections);

    // Auto-expand the new section
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(newSection.sort_order);
      return newSet;
    });
  };

  // Update a specific section
  const updateSection = (index: number, updatedSection: IJobSection) => {
    const updatedSections = sections.map((section, i) =>
      i === index ? updatedSection : section
    );
    onSectionsChange(updatedSections);
  };

  // Delete a section
  const deleteSection = (index: number) => {
    const updatedSections = sections
      .filter((_, i) => i !== index)
      .map((section, i) => ({
        ...section,
        sort_order: i,
      }));

    onSectionsChange(updatedSections);

    // Update collapsed state
    setCollapsedSections(prev => {
      const newSet = new Set();
      prev.forEach(sortOrder => {
        if (sortOrder < index) {
          newSet.add(sortOrder);
        } else if (sortOrder > index) {
          newSet.add(sortOrder - 1);
        }
      });
      return newSet;
    });
  };

  // Toggle section collapse state
  const toggleSectionCollapse = (sortOrder: number) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sortOrder)) {
        newSet.delete(sortOrder);
      } else {
        newSet.add(sortOrder);
      }
      return newSet;
    });
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(
        section => section.sort_order.toString() === active.id
      );
      const newIndex = sections.findIndex(
        section => section.sort_order.toString() === over.id
      );

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          sort_order: index,
        })
      );

      onSectionsChange(reorderedSections);

      // Update collapsed state to match new order
      const wasActiveCollapsed = collapsedSections.has(oldIndex);
      setCollapsedSections(prev => {
        const newSet = new Set();
        prev.forEach(sortOrder => {
          if (sortOrder === oldIndex) {
            if (wasActiveCollapsed) newSet.add(newIndex);
          } else if (sortOrder < oldIndex && sortOrder >= newIndex) {
            newSet.add(sortOrder + 1);
          } else if (sortOrder > oldIndex && sortOrder <= newIndex) {
            newSet.add(sortOrder - 1);
          } else {
            newSet.add(sortOrder);
          }
        });
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="inline-block text-base font-bold text-black">
          Job Sections*
        </label>
        <span className="text-sm text-gray-500">
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sections.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(section => section.sort_order.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section, index) => (
                <SortableJobSection
                  key={`section-${index}`}
                  section={section}
                  onUpdate={(updatedSection) => updateSection(index, updatedSection)}
                  onDelete={() => deleteSection(index)}
                  isCollapsed={collapsedSections.has(section.sort_order)}
                  onToggleCollapse={() => toggleSectionCollapse(section.sort_order)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Section Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => addSection()}
          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[#FFC905] text-[#FF8C05] rounded-lg hover:bg-[#FFC905] hover:text-white transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Section
        </button>

        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Use Template
        </button>
      </div>

      {/* Template Selection */}
      {showTemplates && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Choose a template heading:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DEFAULT_SECTION_TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => {
                  addSection(template);
                  setShowTemplates(false);
                }}
                className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-[#FFC905] hover:text-white transition-colors"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      )}

      {sections.length === 0 && (
        <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">
            No sections yet. Add your first section to get started.
          </p>
          <button
            type="button"
            onClick={() => addSection("About the Role")}
            className="px-6 py-3 bg-[#FFC905] text-white rounded-lg hover:bg-[#FF8C05] transition-colors"
          >
            Add First Section
          </button>
        </div>
      )}
    </div>
  );
};

export default JobSectionsManager;