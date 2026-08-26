"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "./StatCard";

interface AiUsageData {
  today: {
    requests: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
  daily: Array<{ date: string; requests: number; total_tokens: number }>;
  byModel: Array<{ model: string; requests: number; total_tokens: number }>;
  byFeature: Array<{ feature: string; requests: number; total_tokens: number }>;
}

const MODEL_COLORS: Record<string, string> = {
  "openai/gpt-oss-120b": "#FFC905",
  "openai/gpt-oss-20b": "#3b82f6",
  "qwen/qwen3.8-27b": "#10b981",
  "qwen/qwen3.6-27b": "#06b6d4",
  "groq/compound-mini": "#8b5cf6",
  // Decommissioned — retained so historical usage rows keep their colour.
  "llama-3.3-70b-versatile": "#f97316",
  "llama-3.1-8b-instant": "#ec4899",
  "mixtral-8x7b-32768": "#14b8a6",
  "gemma2-9b-it": "#a855f7",
};

function shortModel(model: string): string {
  if (model.includes("gpt-oss-120b")) return "GPT-OSS 120B";
  if (model.includes("gpt-oss-20b")) return "GPT-OSS 20B";
  if (model.includes("qwen3.8")) return "Qwen3.8 27B";
  if (model.includes("qwen3.6")) return "Qwen3.6 27B";
  if (model.includes("compound")) return "Compound Mini";
  // Decommissioned models still present in historical usage rows.
  if (model.includes("70b")) return "Llama 70B";
  if (model.includes("8b")) return "Llama 8B";
  if (model.includes("mixtral")) return "Mixtral";
  if (model.includes("gemma")) return "Gemma 2";
  return model;
}

function shortDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface Props {
  authHeaders: Record<string, string>;
  days?: number;
}

export function GroqUsageSection({ authHeaders, days = 30 }: Props) {
  const [data, setData] = useState<AiUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/ai-usage?days=${days}`, { headers: authHeaders })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">AI Usage (Groq)</h3>
        <div className="flex h-32 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#FFC905]" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const allZeroDaily = data.daily.every((d) => d.requests === 0);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-700">AI Usage (Groq)</h3>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Requests Today"
          value={data.today.requests.toLocaleString()}
          icon={Zap}
          color="yellow"
          description="Groq API calls"
        />
        <StatCard
          title="Tokens Today"
          value={data.today.total_tokens.toLocaleString()}
          icon={Zap}
          color="orange"
          description="Total tokens used"
        />
        <StatCard
          title="Prompt Tokens"
          value={data.today.prompt_tokens.toLocaleString()}
          icon={Zap}
          color="blue"
          description="Input tokens"
        />
        <StatCard
          title="Completion Tokens"
          value={data.today.completion_tokens.toLocaleString()}
          icon={Zap}
          color="green"
          description="Output tokens"
        />
      </div>

      {/* Daily chart + model breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily requests */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Zap className="h-4 w-4" />
                Daily Requests
              </span>
              <span className="text-xs text-gray-400">last {days} days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allZeroDaily ? (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <Zap className="mb-2 h-10 w-10 text-gray-200" />
                <p className="text-sm">No AI calls recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={data.daily.map((d) => ({ ...d, label: shortDate(d.date) }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="groqGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFC905" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FFC905" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v: number) => [v, "Requests"]}
                    labelFormatter={String}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#FFC905"
                    strokeWidth={2}
                    fill="url(#groqGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#FFC905", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Per-model breakdown */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Requests by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byModel.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <p className="text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data.byModel.map((m) => ({ ...m, label: shortModel(m.model) }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v: number) => [v, "Requests"]}
                  />
                  <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                    {data.byModel.map((m) => (
                      <Cell
                        key={m.model}
                        fill={MODEL_COLORS[m.model] ?? "#FFC905"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-feature breakdown */}
      {data.byFeature.length > 0 && (
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Usage by Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byFeature.map((f) => {
                const maxRequests = data.byFeature[0].requests;
                const pct = maxRequests > 0 ? (f.requests / maxRequests) * 100 : 0;
                return (
                  <div key={f.feature}>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium capitalize">{f.feature.replace(/-/g, " ")}</span>
                      <span className="text-gray-400">
                        {f.requests} req · {f.total_tokens.toLocaleString()} tokens
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-[#FFC905]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
