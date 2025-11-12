"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { XMarkIcon, SparklesIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { LoaderIcon } from "lucide-react";

interface GeneratedJobData {
  title: string;
  sections: {
    heading: string;
    content: string;
    sort_order: number;
  }[];
  skills: string[];
  projectType: 'fixed' | 'hourly';
  typeEngagement: 'freelance' | 'remote' | 'any';
  duration: string;
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: string;
}

interface AiJobGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobGenerated: (jobData: GeneratedJobData) => void;
}

export const AiJobGeneratorModal: React.FC<AiJobGeneratorModalProps> = ({
  isOpen,
  onClose,
  onJobGenerated
}) => {
  const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
  const [formData, setFormData] = useState({
    jobTitle: '',
    briefDescription: '',
    companyIndustry: 'Technology',
    experienceLevel: 'mid' as 'entry' | 'mid' | 'senior' | 'lead',
    specificSkills: '',
    budgetRange: '',
    projectType: 'fixed' as 'fixed' | 'hourly',
    remote: true
  });
  const [generatedData, setGeneratedData] = useState<GeneratedJobData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key and outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setGeneratedData(null);
      setFormData({
        jobTitle: '',
        briefDescription: '',
        companyIndustry: 'Technology',
        experienceLevel: 'mid',
        specificSkills: '',
        budgetRange: '',
        projectType: 'fixed',
        remote: true
      });
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateInput = () => {
    if (!formData.jobTitle.trim()) {
      toast.error("Please enter a job title");
      return false;
    }
    if (formData.jobTitle.length < 3) {
      toast.error("Job title must be at least 3 characters");
      return false;
    }
    if (!formData.briefDescription.trim()) {
      toast.error("Please provide a brief description");
      return false;
    }
    if (formData.briefDescription.length < 10) {
      toast.error("Description must be at least 10 characters");
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    setStep('generating');

    try {
      const skillsArray = formData.specificSkills
        ? formData.specificSkills.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const response = await fetch('/api/companies/ai-generate-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          specificSkills: skillsArray
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate job posting');
      }

      if (result.status === 'success' && result.data) {
        setGeneratedData(result.data);
        setStep('preview');
        toast.success("Job posting generated successfully!");
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate job posting. Please try again.');
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseGenerated = () => {
    if (generatedData) {
      onJobGenerated(generatedData);
      onClose();
      toast.success("Job data applied to form!");
    }
  };

  const handleTryAgain = () => {
    setStep('input');
    setGeneratedData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Job with AI</h2>
                <p className="text-sm text-gray-600">Generate a professional job posting in seconds</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'input' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Job Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Full Stack Developer"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      maxLength={100}
                    />
                  </div>

                  {/* Brief Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brief Description *
                    </label>
                    <textarea
                      placeholder="Describe what this role involves, key responsibilities, or what you're looking for..."
                      value={formData.briefDescription}
                      onChange={(e) => handleInputChange('briefDescription', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.briefDescription.length}/1000 characters
                    </div>
                  </div>

                  {/* Company Industry */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={formData.companyIndustry}
                      onChange={(e) => handleInputChange('companyIndustry', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Blockchain/Web3">Blockchain/Web3</option>
                      <option value="SaaS">SaaS</option>
                      <option value="Startup">Startup</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    >
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior Level (6+ years)</option>
                      <option value="lead">Lead/Principal (8+ years)</option>
                    </select>
                  </div>

                  {/* Specific Skills */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Key Skills/Technologies
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., React, Node.js, Python (comma-separated)"
                      value={formData.specificSkills}
                      onChange={(e) => handleInputChange('specificSkills', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Optional: Separate multiple skills with commas
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., $2000-5000 or $50/hour"
                      value={formData.budgetRange}
                      onChange={(e) => handleInputChange('budgetRange', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Optional: AI will suggest budget if not provided
                    </div>
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="projectType"
                          value="fixed"
                          checked={formData.projectType === 'fixed'}
                          onChange={(e) => handleInputChange('projectType', e.target.value)}
                          className="mr-2 text-yellow-500 focus:ring-yellow-500"
                        />
                        Fixed Budget
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="projectType"
                          value="hourly"
                          checked={formData.projectType === 'hourly'}
                          onChange={(e) => handleInputChange('projectType', e.target.value)}
                          className="mr-2 text-yellow-500 focus:ring-yellow-500"
                        />
                        Hourly Rate
                      </label>
                    </div>
                  </div>

                  {/* Remote Work */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Work Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="remote"
                          checked={formData.remote === true}
                          onChange={() => handleInputChange('remote', true)}
                          className="mr-2 text-yellow-500 focus:ring-yellow-500"
                        />
                        Remote
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="remote"
                          checked={formData.remote === false}
                          onChange={() => handleInputChange('remote', false)}
                          className="mr-2 text-yellow-500 focus:ring-yellow-500"
                        />
                        On-site
                      </label>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Job Posting
                  </button>
                </div>
              </div>
            )}

            {step === 'generating' && (
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-yellow-200 rounded-full animate-spin">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <SparklesIcon className="w-8 h-8 text-yellow-500 absolute top-4 left-4" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Generating Your Job Posting...
                  </h3>
                  <p className="text-gray-600">
                    Our AI is crafting a professional job description for you
                  </p>
                </div>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            {step === 'preview' && generatedData && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-900">Job posting generated successfully!</h3>
                    <p className="text-sm text-green-700">Review the content below and make any adjustments if needed.</p>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {/* Title and Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{generatedData.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <div className="text-gray-600 capitalize">{generatedData.projectType}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Engagement:</span>
                        <div className="text-gray-600 capitalize">{generatedData.typeEngagement}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <div className="text-gray-600">{generatedData.duration.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Budget:</span>
                        <div className="text-gray-600">
                          ${generatedData.estimatedBudget.min} - ${generatedData.estimatedBudget.max}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Skills Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sections */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Job Description Sections</h4>
                    <div className="space-y-4">
                      {generatedData.sections.map((section, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{section.heading}</h5>
                          <div
                            className="text-sm text-gray-600 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: section.content }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={handleTryAgain}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Generate Different Version
                  </button>
                  <button
                    onClick={handleUseGenerated}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    Use This Job Posting
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};