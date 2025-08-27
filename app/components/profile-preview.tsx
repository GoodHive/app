"use client";

import { ProfileData } from "@/app/talents/my-profile/page";
import Image from "next/image";

interface ProfilePreviewProps {
  profileData: ProfileData;
  selectedSkills: string[];
  className?: string;
}

export function ProfilePreview({
  profileData,
  selectedSkills,
  className = "",
}: ProfilePreviewProps) {
  const completionPercentage = Math.round(
    (Object.values(profileData).filter(Boolean).length / 10) * 100,
  );

  return (
    <div className={`bee-card p-6 sticky top-8 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">
          Profile Preview
        </h3>
        <p className="text-sm text-neutral-600">
          How others will see your profile
        </p>
      </div>

      {/* Profile Image */}
      <div className="text-center mb-6">
        {profileData.image_url ? (
          <Image
            src={profileData.image_url}
            alt={`${profileData.first_name} ${profileData.last_name}`}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-honey-primary/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
            👤
          </div>
        )}
      </div>

      {/* Name and Title */}
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-neutral-800">
          {profileData.first_name && profileData.last_name
            ? `${profileData.first_name} ${profileData.last_name}`
            : "Your Name"}
        </h4>
        <p className="text-honey-dark font-medium mt-1">
          {profileData.title || "Your Professional Title"}
        </p>
        <p className="text-sm text-neutral-600 mt-2">
          {profileData.city && profileData.country
            ? `${profileData.city}, ${profileData.country}`
            : "Location"}
        </p>
      </div>

      {/* Availability Status */}
      {profileData.availability && (
        <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-green-50 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">
            Available for Work
          </span>
        </div>
      )}

      {/* Skills Preview */}
      {selectedSkills.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-neutral-700 mb-2">
            Skills
          </h5>
          <div className="flex flex-wrap gap-1">
            {selectedSkills.slice(0, 6).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-honey-primary/10 text-honey-dark text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
            {selectedSkills.length > 6 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{selectedSkills.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Rate */}
      {profileData.rate && (
        <div className="mb-6 p-3 bg-honey-primary/5 rounded-lg">
          <div className="text-sm text-neutral-600">Hourly Rate</div>
          <div className="text-lg font-bold text-honey-dark">
            ${profileData.rate}/hour
          </div>
        </div>
      )}

      {/* Work Preferences */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-neutral-700 mb-2">
          Work Style
        </h5>
        <div className="space-y-1">
          {profileData.remote_only && (
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span>🌍</span> Remote Only
            </div>
          )}
          {profileData.freelance_only && (
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span>💼</span> Freelance Only
            </div>
          )}
        </div>
      </div>

      {/* Completion Progress */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-neutral-600">Profile Completion</span>
          <span className="font-semibold text-neutral-800">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-honey-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* View Full Profile Button */}
      <button className="w-full mt-4 py-2 px-4 bg-honey-primary text-neutral-800 font-medium rounded-lg hover:bg-honey-secondary transition-colors">
        View Full Profile
      </button>
    </div>
  );
}
