"use client";

import { BarChart3, TrendingUp, Users, DollarSign, Clock, Target } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 text-white text-center">
        <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-2">Analytics & Insights</h2>
        <p className="text-yellow-100 mb-4">
          Get detailed insights into your job performance, application trends, and hiring metrics.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg">
          <Clock className="w-4 h-4 mr-2" />
          Coming Soon
        </div>
      </div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Application Trends</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-400 mb-2">--</div>
          <p className="text-sm text-gray-500">Applications over time</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Conversion Rate</h3>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-400 mb-2">--%</div>
          <p className="text-sm text-gray-500">View to application ratio</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Funding Efficiency</h3>
            <DollarSign className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-400 mb-2">--</div>
          <p className="text-sm text-gray-500">Cost per quality hire</p>
        </div>
      </div>

      {/* Features Preview */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Analytics Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Job Performance Metrics</p>
              <p className="text-sm text-gray-600">Track views, applications, and conversion rates for each job posting.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Trend Analysis</p>
              <p className="text-sm text-gray-600">Understand hiring patterns and optimize posting timing.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Talent Insights</p>
              <p className="text-sm text-gray-600">Analyze applicant quality and skills matching effectiveness.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">ROI Analysis</p>
              <p className="text-sm text-gray-600">Measure funding effectiveness and hiring cost optimization.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}