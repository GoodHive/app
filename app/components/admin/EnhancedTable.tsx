"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  MoreVertical,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBuilder, FilterCondition } from "./FilterBuilder";
import { ExportButton } from "./ExportButton";
import { Filter } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  filterable?: boolean;
  visible?: boolean; // For column visibility
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  action: (selectedItems: T[]) => void | Promise<void>;
  variant?: "default" | "destructive" | "outline";
  requiresConfirmation?: boolean;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  itemsPerPage?: number;
  exportable?: boolean;
  onExport?: (data: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean; // Enable row selection
  getRowId?: (row: T) => string | number; // Function to get unique ID for each row
  bulkActions?: BulkAction<T>[]; // Bulk action menu items
  onSelectionChange?: (selectedItems: T[]) => void; // Callback when selection changes
  enableFilterBuilder?: boolean; // Enable custom filter builder
  enableColumnSelection?: boolean; // Enable column selection for export
}

type SortDirection = "asc" | "desc" | null;

export function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  pagination = true,
  itemsPerPage = 10,
  exportable = false,
  onExport,
  loading = false,
  emptyMessage = "No data found",
  selectable = false,
  getRowId,
  bulkActions = [],
  onSelectionChange,
  enableFilterBuilder = false,
  enableColumnSelection = false,
}: EnhancedTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set(),
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((col) => col.key)),
  );
  const [customFilters, setCustomFilters] = useState<FilterCondition[]>([]);
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND");
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [savedPresets, setSavedPresets] = useState<any[]>([]);

  // Filter visible columns
  const displayColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  // Get row ID helper
  const getRowIdentifier = useCallback(
    (row: T, index: number): string | number => {
      if (getRowId) {
        return getRowId(row);
      }
      // Fallback to index or common ID fields
      return (row.id || row.user_id || row.userid || index) as string | number;
    },
    [getRowId],
  );

  // Load saved presets from localStorage
  useEffect(() => {
    if (enableFilterBuilder) {
      try {
        const saved = localStorage.getItem("filterPresets");
        if (saved) {
          setSavedPresets(JSON.parse(saved));
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [enableFilterBuilder]);

  // Apply custom filters to data
  const applyCustomFilters = useCallback(
    (rows: T[], conditions: FilterCondition[], logic: "AND" | "OR"): T[] => {
      if (conditions.length === 0) return rows;

      return rows.filter((row) => {
        const results = conditions.map((condition) => {
          const value = row[condition.column];
          const filterValue = condition.value;

          switch (condition.operator) {
            case "equals":
              return String(value) === String(filterValue);
            case "contains":
              return String(value)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase());
            case "startsWith":
              return String(value)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase());
            case "endsWith":
              return String(value)
                .toLowerCase()
                .endsWith(String(filterValue).toLowerCase());
            case "greaterThan":
              return Number(value) > Number(filterValue);
            case "lessThan":
              return Number(value) < Number(filterValue);
            case "between":
              if (Array.isArray(filterValue) && filterValue.length === 2) {
                return (
                  Number(value) >= Number(filterValue[0]) &&
                  Number(value) <= Number(filterValue[1])
                );
              }
              return false;
            case "in":
              if (Array.isArray(filterValue)) {
                return filterValue.includes(String(value));
              }
              return false;
            default:
              return true;
          }
        });

        return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
      });
    },
    []
  );

  // Filter data based on search query and custom filters
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search query
    if (searchQuery) {
      result = result.filter((row) => {
        return displayColumns.some((col) => {
          const value = row[col.key];
          if (value === null || value === undefined) return false;
          return String(value)
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        });
      });
    }

    // Apply custom filters
    if (customFilters.length > 0) {
      result = applyCustomFilters(result, customFilters, filterLogic);
    }

    return result;
  }, [
    data,
    searchQuery,
    displayColumns,
    customFilters,
    filterLogic,
    applyCustomFilters,
  ]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison =
        typeof aValue === "string"
          ? aValue.localeCompare(String(bValue))
          : aValue - bValue;

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Get selected items
  const selectedItems = useMemo(() => {
    return filteredData.filter((row, index) =>
      selectedRows.has(getRowIdentifier(row, index)),
    );
  }, [filteredData, selectedRows, getRowIdentifier]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handleSelectRow = (row: T, index: number) => {
    const rowId = getRowIdentifier(row, index);
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(
        paginatedData.map((row, index) => getRowIdentifier(row, index)),
      );
      setSelectedRows(allIds);
    }
  };

  const isAllSelected = useMemo(() => {
    return (
      paginatedData.length > 0 &&
      paginatedData.every((row, index) =>
        selectedRows.has(getRowIdentifier(row, index)),
      )
    );
  }, [paginatedData, selectedRows, getRowIdentifier]);

  const handleBulkAction = async (action: BulkAction<T>) => {
    if (selectedItems.length === 0) return;

    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedItems.length} item(s)?`,
      );
      if (!confirmed) return;
    }

    try {
      await action.action(selectedItems);
      // Clear selection after action
      setSelectedRows(new Set());
    } catch (error) {
      console.error("Bulk action error:", error);
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const showAllColumns = () => {
    setVisibleColumns(new Set(columns.map((col) => col.key)));
  };

  const hideAllColumns = () => {
    setVisibleColumns(new Set());
  };

  const handleSavePreset = (preset: any) => {
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem("filterPresets", JSON.stringify(updated));
  };

  const handleLoadPreset = (preset: any) => {
    setCustomFilters(preset.conditions);
    setFilterLogic(preset.logic);
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = savedPresets.filter((p) => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem("filterPresets", JSON.stringify(updated));
  };

  const handleApplyFilters = (
    conditions: FilterCondition[],
    logic: "AND" | "OR"
  ) => {
    setCustomFilters(conditions);
    setFilterLogic(logic);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="h-4 w-4 text-[#FFC905]" />;
    }
    if (sortDirection === "desc") {
      return <ChevronDown className="h-4 w-4 text-[#FFC905]" />;
    }
    return <ChevronUp className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Search, Export, Bulk Actions, and Column Visibility Bar */}
      {(searchable ||
        exportable ||
        enableFilterBuilder ||
        (selectable && selectedItems.length > 0) ||
        columns.length > 1) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {searchable && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            )}
            {enableFilterBuilder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterBuilder(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Custom Filters
                {customFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {customFilters.length}
                  </Badge>
                )}
              </Button>
            )}
            {selectable && selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedItems.length} selected
                </Badge>
                {bulkActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {bulkActions.map((action, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => handleBulkAction(action)}
                          className={
                            action.variant === "destructive"
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {action.icon && (
                            <span className="mr-2">{action.icon}</span>
                          )}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Column Visibility Toggle */}
            {columns.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {visibleColumns.size === columns.length ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    Columns ({visibleColumns.size}/{columns.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold border-b">
                    Toggle Columns
                  </div>
                  {columns.map((column) => {
                    const isVisible = visibleColumns.has(column.key);
                    return (
                      <DropdownMenuItem
                        key={column.key}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleColumnVisibility(column.key);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={isVisible}
                          onCheckedChange={() =>
                            toggleColumnVisibility(column.key)
                          }
                        />
                        <span className={isVisible ? "" : "text-gray-400"}>
                          {column.header}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                  <div className="border-t mt-1 pt-1">
                    <DropdownMenuItem
                      onClick={showAllColumns}
                      className="text-sm text-[#FFC905] cursor-pointer"
                    >
                      Show All
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={hideAllColumns}
                      className="text-sm text-gray-500 cursor-pointer"
                    >
                      Hide All
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {exportable && (
              <ExportButton
                data={filteredData}
                columns={displayColumns.map((col) => ({
                  key: col.key,
                  header: col.header,
                }))}
                fileName={`export-${new Date().toISOString().split("T")[0]}`}
                allowColumnSelection={enableColumnSelection}
                onExportCSV={(selectedCols) => {
                  if (onExport) {
                    const filtered = filteredData.map((row) => {
                      const result: any = {};
                      (selectedCols || displayColumns.map((c) => c.key)).forEach(
                        (key) => {
                          result[key] = row[key];
                        }
                      );
                      return result;
                    });
                    onExport(filtered);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Custom Filter Builder Dialog */}
      {enableFilterBuilder && (
        <FilterBuilder
          columns={columns.map((col) => ({
            key: col.key,
            header: col.header,
            type: "string" as const, // Could be enhanced to detect type
          }))}
          onApply={handleApplyFilters}
          onSavePreset={handleSavePreset}
          savedPresets={savedPresets}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          open={showFilterBuilder}
          onOpenChange={setShowFilterBuilder}
        />
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {displayColumns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={
                    column.sortable ? "cursor-pointer hover:bg-gray-50" : ""
                  }
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumns.length + (selectable ? 1 : 0)}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC905]"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumns.length + (selectable ? 1 : 0)}
                  className="text-center py-8 text-gray-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const rowId = getRowIdentifier(row, index);
                const isSelected = selectedRows.has(rowId);
                return (
                  <TableRow
                    key={rowId}
                    className={isSelected ? "bg-[#FFC905]/10" : ""}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(row, index)}
                        />
                      </TableCell>
                    )}
                    {displayColumns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span>{" "}
            of <span className="font-medium">{filteredData.length}</span>{" "}
            results
            {selectable && selectedItems.length > 0 && (
              <span className="ml-2 text-[#FFC905]">
                • {selectedItems.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
