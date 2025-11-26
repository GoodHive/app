"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp } from "lucide-react";

interface DataPoint {
  date: string;
  count: number;
}

interface JobTrendsChartProps {
  data: DataPoint[];
  loading?: boolean;
}

export function JobTrendsChart({ data, loading }: JobTrendsChartProps) {
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    if (data.length > 0) {
      const max = Math.max(...data.map((d) => d.count));
      setMaxValue(max);
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Posting Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC905]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Posting Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalJobs = data.reduce((sum, point) => sum + point.count, 0);
  const averagePerDay = (totalJobs / data.length).toFixed(1);
  const trend = data.length >= 2
    ? data[data.length - 1].count - data[0].count
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Job Posting Trends
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Total: {totalJobs} jobs</span>
          <span>Avg: {averagePerDay} per day</span>
          {trend !== 0 && (
            <span className={`flex items-center gap-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              <TrendingUp className={`h-4 w-4 ${trend < 0 ? "rotate-180" : ""}`} />
              {trend > 0 ? "+" : ""}{trend}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Line chart representation */}
          <div className="flex items-end gap-1 h-64 relative">
            {data.map((point, index) => {
              const height = maxValue > 0 ? (point.count / maxValue) * 100 : 0;
              const nextPoint = data[index + 1];
              const nextHeight = nextPoint && maxValue > 0
                ? (nextPoint.count / maxValue) * 100
                : 0;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  <div className="w-full flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${point.count} jobs`}
                    >
                      {nextPoint && (
                        <div
                          className="absolute top-0 left-full w-full h-0.5 bg-blue-500"
                          style={{
                            transform: `rotate(${Math.atan2(
                              nextHeight - height,
                              100
                            ) * (180 / Math.PI)}deg)`,
                            transformOrigin: "left center",
                          }}
                        />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 hidden group-hover:block">
                      {point.count}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(point.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

