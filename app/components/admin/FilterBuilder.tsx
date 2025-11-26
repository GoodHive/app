"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Filter, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterCondition {
  id: string;
  column: string;
  operator: "equals" | "contains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "between" | "in";
  value: string | string[];
  logic?: "AND" | "OR";
}

export interface FilterPreset {
  id: string;
  name: string;
  conditions: FilterCondition[];
  logic: "AND" | "OR";
}

interface FilterBuilderProps {
  columns: Array<{ key: string; header: string; type?: "string" | "number" | "date" | "boolean" }>;
  onApply: (conditions: FilterCondition[], logic: "AND" | "OR") => void;
  onSavePreset?: (preset: FilterPreset) => void;
  savedPresets?: FilterPreset[];
  onLoadPreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (presetId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const operators = {
  string: ["equals", "contains", "startsWith", "endsWith", "in"],
  number: ["equals", "greaterThan", "lessThan", "between"],
  date: ["equals", "greaterThan", "lessThan", "between"],
  boolean: ["equals"],
};

export function FilterBuilder({
  columns,
  onApply,
  onSavePreset,
  savedPresets = [],
  onLoadPreset,
  onDeletePreset,
  open,
  onOpenChange,
}: FilterBuilderProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    if (!open) {
      setConditions([]);
      setPresetName("");
    }
  }, [open]);

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      column: columns[0]?.key || "",
      operator: "equals",
      value: "",
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleApply = () => {
    const validConditions = conditions.filter(
      (c) => c.column && c.value && (Array.isArray(c.value) ? c.value.length > 0 : true)
    );
    if (validConditions.length > 0) {
      onApply(validConditions, logic);
      onOpenChange(false);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim() || conditions.length === 0) return;
    if (onSavePreset) {
      const preset: FilterPreset = {
        id: `preset-${Date.now()}`,
        name: presetName,
        conditions,
        logic,
      };
      onSavePreset(preset);
      setPresetName("");
      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem("filterPresets") || "[]");
      saved.push(preset);
      localStorage.setItem("filterPresets", JSON.stringify(saved));
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setConditions(preset.conditions);
    setLogic(preset.logic);
    if (onLoadPreset) {
      onLoadPreset(preset);
    }
  };

  const getColumnType = (columnKey: string) => {
    const column = columns.find((c) => c.key === columnKey);
    return column?.type || "string";
  };

  const getAvailableOperators = (columnKey: string) => {
    const type = getColumnType(columnKey);
    return operators[type as keyof typeof operators] || operators.string;
  };

  const renderValueInput = (condition: FilterCondition) => {
    const type = getColumnType(condition.column);
    const ops = getAvailableOperators(condition.column);

    if (condition.operator === "between") {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={type === "date" ? "date" : type === "number" ? "number" : "text"}
            placeholder="From"
            value={Array.isArray(condition.value) ? condition.value[0] || "" : ""}
            onChange={(e) =>
              updateCondition(condition.id, {
                value: [e.target.value, Array.isArray(condition.value) ? condition.value[1] || "" : ""],
              })
            }
            className="flex-1"
          />
          <span className="text-sm text-gray-500">to</span>
          <Input
            type={type === "date" ? "date" : type === "number" ? "number" : "text"}
            placeholder="To"
            value={Array.isArray(condition.value) ? condition.value[1] || "" : ""}
            onChange={(e) =>
              updateCondition(condition.id, {
                value: [Array.isArray(condition.value) ? condition.value[0] || "" : "", e.target.value],
              })
            }
            className="flex-1"
          />
        </div>
      );
    }

    if (condition.operator === "in") {
      return (
        <Input
          placeholder="Comma-separated values"
          value={Array.isArray(condition.value) ? condition.value.join(", ") : condition.value}
          onChange={(e) =>
            updateCondition(condition.id, {
              value: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
            })
          }
        />
      );
    }

    return (
      <Input
        type={type === "date" ? "date" : type === "number" ? "number" : "text"}
        placeholder="Enter value"
        value={typeof condition.value === "string" ? condition.value : ""}
        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#FFC905]" />
            Custom Filter Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium mb-2 block">
                Saved Presets
              </Label>
              <div className="flex flex-wrap gap-2">
                {savedPresets.map((preset) => (
                  <Badge
                    key={preset.id}
                    variant="secondary"
                    className="cursor-pointer gap-2 px-3 py-1"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    {preset.name}
                    {onDeletePreset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePreset(preset.id);
                        }}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Logic Selector */}
          {conditions.length > 1 && (
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Combine conditions with:</Label>
              <Select value={logic} onValueChange={(value: "AND" | "OR") => setLogic(value)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conditions */}
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div
                key={condition.id}
                className="flex items-start gap-2 p-3 border rounded-lg bg-white"
              >
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <Select
                    value={condition.column}
                    onValueChange={(value) =>
                      updateCondition(condition.id, {
                        column: value,
                        operator: "equals",
                        value: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col.key} value={col.key}>
                          {col.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value: FilterCondition["operator"]) =>
                      updateCondition(condition.id, {
                        operator: value,
                        value: value === "between" ? ["", ""] : value === "in" ? [] : "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableOperators(condition.column).map((op) => (
                        <SelectItem key={op} value={op}>
                          {op.charAt(0).toUpperCase() + op.slice(1).replace(/([A-Z])/g, " $1")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="col-span-2">
                    {renderValueInput(condition)}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(condition.id)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {conditions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No filter conditions added yet</p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={addCondition}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>

          {/* Save Preset */}
          {onSavePreset && conditions.length > 0 && (
            <div className="flex items-center gap-2 border-t pt-4">
              <Input
                placeholder="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Preset
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={conditions.length === 0}
            className="bg-[#FFC905] hover:bg-[#FFC905]/90"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

