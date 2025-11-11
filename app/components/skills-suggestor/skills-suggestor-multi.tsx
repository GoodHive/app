import React, { useState, useEffect, useRef } from "react";
import skills from "../../../json/skills.json";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface SkillsSuggestionMultiProps {
  onSkillsChange?: (skills: string[]) => void;
  classes?: string;
  value?: string[];
  placeholder?: string;
}

export const SkillsSuggestionMulti: React.FC<SkillsSuggestionMultiProps> = ({
  onSkillsChange,
  classes,
  value = [],
  placeholder = "Search skills..."
}) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(value);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedSkills(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!inputValue) {
      setSuggestions([]);
      return;
    }

    const filteredSkills = skills.filter((skill) =>
      skill.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedSkills.includes(skill.name)
    );
    setSuggestions(filteredSkills as Skill[]);
  }, [inputValue, selectedSkills]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  const handleSkillSelect = (skill: Skill) => {
    const newSkills = [...selectedSkills, skill.name];
    setSelectedSkills(newSkills);
    setInputValue("");
    setIsOpen(false);
    onSkillsChange?.(newSkills);
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    setSelectedSkills(newSkills);
    onSkillsChange?.(newSkills);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !inputValue && selectedSkills.length > 0) {
      const newSkills = selectedSkills.slice(0, -1);
      setSelectedSkills(newSkills);
      onSkillsChange?.(newSkills);
    }
  };

  const handleAddNewSkill = () => {
    if (inputValue.trim() && !selectedSkills.includes(inputValue.trim())) {
      const newSkills = [...selectedSkills, inputValue.trim()];
      setSelectedSkills(newSkills);
      setInputValue("");
      setIsOpen(false);
      onSkillsChange?.(newSkills);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        className={classes}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          alignItems: 'center',
          cursor: 'text'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedSkills.map((skill) => (
          <span
            key={skill}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {skill}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveSkill(skill);
              }}
              style={{
                borderRadius: '9999px',
                padding: '0.125rem',
                transition: 'background-color 0.15s',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fde68a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg style={{ width: '0.75rem', height: '0.75rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedSkills.length === 0 ? placeholder : ""}
          style={{
            flex: '1',
            minWidth: '150px',
            background: 'transparent',
            outline: 'none',
            border: 'none',
            padding: '0',
            fontSize: '1rem',
            fontWeight: 'normal',
            color: 'var(--gh-gray-700)'
          }}
        />
      </div>
      {isOpen && (suggestions.length > 0 || (inputValue.trim() && !skills.some(skill =>
        skill.name.toLowerCase() === inputValue.toLowerCase()
      ))) && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            zIndex: 10,
            width: '100%',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxHeight: '15rem',
            overflowY: 'auto',
            marginTop: '0.25rem'
          }}
        >
          {suggestions.map((skill) => (
            <div
              key={skill.id}
              onClick={() => handleSkillSelect(skill)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{skill.name}</span>
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem'
              }}>
                {skill.category}
              </span>
            </div>
          ))}
          {inputValue.trim() && !skills.some(skill =>
            skill.name.toLowerCase() === inputValue.toLowerCase()
          ) && !selectedSkills.includes(inputValue.trim()) && (
            <div
              onClick={handleAddNewSkill}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                color: '#2563eb',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              + Add "{inputValue}" as new skill
            </div>
          )}
        </div>
      )}
    </div>
  );
};