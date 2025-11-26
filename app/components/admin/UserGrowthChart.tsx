"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";

interface DataPoint {
  date: string;
  count: number;
}

interface UserGrowthChartProps {
  data: DataPoint[];
  loading?: boolean;
}

export function UserGrowthChart({ data, loading }: UserGrowthChartProps) {
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
            <Users className="h-5 w-5" />
            User Growth
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
            <Users className="h-5 w-5" />
            User Growth
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

  const totalGrowth = data.reduce((sum, point) => sum + point.count, 0);
  const averagePerDay = (totalGrowth / data.length).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Growth
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Total: {totalGrowth} users</span>
          <span>Avg: {averagePerDay} per day</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Simple bar chart */}
          <div className="flex items-end gap-1 h-64">
            {data.map((point, index) => {
              const height = maxValue > 0 ? (point.count / maxValue) * 100 : 0;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="w-full flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-[#FFC905] to-yellow-400 rounded-t hover:from-yellow-500 hover:to-yellow-400 transition-all cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${point.count} users`}
                    />
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

