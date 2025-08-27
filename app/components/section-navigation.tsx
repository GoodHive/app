"use client";

import React, { useState, useEffect } from "react";

interface NavigationSection {
  id: string;
  label: string;
  icon: string;
  isComplete?: boolean;
  isRequired?: boolean;
}

interface SectionNavigationProps {
  sections: NavigationSection[];
  activeSection?: string;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  activeSection,
  onSectionClick,
  className = "",
}) => {
  const [currentSection, setCurrentSection] = useState(activeSection || sections[0]?.id);

  useEffect(() => {
    if (activeSection) {
      setCurrentSection(activeSection);
    }
  }, [activeSection]);

  useEffect(() => {
    const handleScroll = () => {
      // Auto-detect current section based on scroll position
      const sectionElements = sections.map(section => 
        document.getElementById(section.id)
      ).filter(Boolean);

      let currentSectionId = sections[0]?.id;
      
      for (const element of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            currentSectionId = element.id;
          }
        }
      }
      
      setCurrentSection(currentSectionId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleNavClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    
    // Smooth scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for sticky header
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }

    onSectionClick?.(sectionId);
  };

  const completedSections = sections.filter(section => section.isComplete);
  const totalSections = sections.length;
  const progressPercentage = (completedSections.length / totalSections) * 100;

  return (
    <nav className={`section-nav ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <span className="text-lg">🗂️</span>
          Quick Navigation
        </h3>
        <div className="text-xs text-neutral-500">
          {completedSections.length}/{totalSections}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-honey-primary to-honey-secondary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Navigation Items */}
      <div className="space-y-1">
        {sections.map((section, index) => {
          const isActive = currentSection === section.id;
          const isCompleted = section.isComplete;
          
          return (
            <button
              key={section.id}
              onClick={() => handleNavClick(section.id)}
              className={`
                nav-item w-full text-left transition-all duration-200
                ${isActive ? 'active bg-honey-lighter text-honey-dark' : 'text-neutral-600 hover:bg-honey-lighter hover:text-honey-dark'}
                ${isCompleted ? 'completed' : ''}
              `}
              aria-label={`Navigate to ${section.label} section`}
            >
              <div className="flex items-center gap-3">
                {/* Step Number or Icon */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200
                  ${isCompleted 
                    ? 'bg-success text-white' 
                    : isActive 
                    ? 'bg-honey-primary text-neutral-800' 
                    : 'bg-neutral-200 text-neutral-500'
                  }
                `}>
                  {isCompleted ? (
                    <span className="text-xs">✓</span>
                  ) : (
                    <span className="text-xs">{section.icon || (index + 1)}</span>
                  )}
                </div>

                {/* Section Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`
                      font-medium truncate
                      ${isActive ? 'text-honey-dark' : 'text-inherit'}
                    `}>
                      {section.label}
                    </p>
                    {section.isRequired && (
                      <span className="text-honey-accent text-xs">*</span>
                    )}
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1 mt-1">
                    {isCompleted ? (
                      <span className="text-xs text-success flex items-center gap-1">
                        <span>✓</span>
                        Complete
                      </span>
                    ) : isActive ? (
                      <span className="text-xs text-honey-dark flex items-center gap-1">
                        <span>📝</span>
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow indicator for active section */}
                {isActive && (
                  <div className="text-honey-primary">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-3 bg-gradient-to-r from-honey-lighter to-honey-light rounded-lg border border-honey-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">🎯</span>
          <div>
            <p className="font-medium text-honey-dark">
              {completedSections.length === totalSections 
                ? "Profile Complete!" 
                : `${totalSections - completedSections.length} sections remaining`
              }
            </p>
            <p className="text-xs text-honey-dark/70">
              {completedSections.length === totalSections 
                ? "Ready to submit for review" 
                : "Complete all sections to submit"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={() => {
            const firstIncomplete = sections.find(s => !s.isComplete);
            if (firstIncomplete) {
              handleNavClick(firstIncomplete.id);
            }
          }}
          className="w-full btn-honey-ghost text-xs py-2 px-3 hover:bg-honey-lighter"
          disabled={completedSections.length === totalSections}
        >
          <span className="mr-1">⚡</span>
          Jump to Next Section
        </button>
        
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentSection(sections[0]?.id);
          }}
          className="w-full btn-honey-ghost text-xs py-2 px-3 hover:bg-honey-lighter"
        >
          <span className="mr-1">🔝</span>
          Back to Top
        </button>
      </div>
    </nav>
  );
};

export default SectionNavigation;