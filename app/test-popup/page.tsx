"use client";

import { useState } from "react";
import { JobApplicationPopup } from "@/app/components/job-application-popup";

export default function TestPopupPage() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🍯 Test Job Application Popup
        </h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Click the button below to test our beautiful new job application popup!
        </p>

        <button
          onClick={() => setShowPopup(true)}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-full hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          🐝 Test Apply Now Popup
        </button>

        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto">
          <h3 className="font-semibold text-gray-800 mb-2">Sample Job Details:</h3>
          <p className="text-sm text-gray-600">
            <strong>Position:</strong> Senior Frontend Developer<br/>
            <strong>Company:</strong> TechHive Solutions<br/>
            <strong>Email:</strong> jobs@techhive.com
          </p>
        </div>
      </div>

      <JobApplicationPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        jobTitle="Senior Frontend Developer"
        companyName="TechHive Solutions"
        companyEmail="jobs@techhive.com"
        jobId={123}
        walletAddress="0x1234567890abcdef"
      />
    </div>
  );
}