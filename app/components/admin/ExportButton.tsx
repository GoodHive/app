"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  onExportCSV?: (selectedColumns?: string[]) => void;
  onExportJSON?: (selectedColumns?: string[]) => void;
  onExportExcel?: (selectedColumns?: string[]) => void;
  onExportPDF?: (selectedColumns?: string[]) => void;
  data?: any[];
  columns?: Array<{ key: string; header: string }>;
  fileName?: string;
  disabled?: boolean;
  allowColumnSelection?: boolean;
}

export function ExportButton({
  onExportCSV,
  onExportJSON,
  onExportExcel,
  onExportPDF,
  data = [],
  columns = [],
  fileName = "export",
  disabled = false,
  allowColumnSelection = false,
}: ExportButtonProps) {
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"CSV" | "JSON" | "XLSX" | "PDF" | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.map((col) => col.key))
  );

  // Load saved column selection from localStorage
  useEffect(() => {
    if (allowColumnSelection) {
      const saved = localStorage.getItem(`exportColumns_${fileName}`);
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          setSelectedColumns(new Set(savedColumns));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [fileName, allowColumnSelection]);

  const defaultExportCSV = (selectedCols?: string[]) => {
    if (!data || data.length === 0) return;

    const colsToExport = selectedCols || columns.map((col) => col.key);
    const headers = columns
      .filter((col) => colsToExport.includes(col.key))
      .map((col) => col.header);
    
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        colsToExport
          .map((key) => {
            const value = row[key];
            if (value === null || value === undefined) return "";
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
          })
          .join(",")
      ),
    ];

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const defaultExportJSON = (selectedCols?: string[]) => {
    if (!data || data.length === 0) return;

    const colsToExport = selectedCols || columns.map((col) => col.key);
    const jsonData = data.map((row) => {
      const filtered: any = {};
      colsToExport.forEach((key) => {
        filtered[key] = row[key];
      });
      return filtered;
    });

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const defaultExportExcel = async (selectedCols?: string[]) => {
    if (!data || data.length === 0) return;

    // Try to use xlsx library if available, otherwise fallback to CSV
    try {
      // @ts-ignore - xlsx might not be installed
      const XLSX = await import("xlsx");
      const colsToExport = selectedCols || columns.map((col) => col.key);
      
      const worksheetData = data.map((row) => {
        const filtered: any = {};
        colsToExport.forEach((key) => {
          const col = columns.find((c) => c.key === key);
          filtered[col?.header || key] = row[key];
        });
        return filtered;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
      // Fallback to CSV if xlsx is not available
      console.warn("xlsx library not available, falling back to CSV");
      defaultExportCSV(selectedCols);
    }
  };

  const handleExport = (format: "CSV" | "JSON" | "XLSX" | "PDF") => {
    if (allowColumnSelection && columns.length > 0) {
      setSelectedFormat(format);
      setShowColumnDialog(true);
    } else {
      executeExport(format, Array.from(selectedColumns));
    }
  };

  const executeExport = (format: "CSV" | "JSON" | "XLSX" | "PDF", cols?: string[]) => {
    const colsToExport = cols || Array.from(selectedColumns);

    // Save column selection
    if (allowColumnSelection) {
      localStorage.setItem(`exportColumns_${fileName}`, JSON.stringify(colsToExport));
    }

    switch (format) {
      case "CSV":
        if (onExportCSV) {
          onExportCSV(colsToExport);
        } else {
          defaultExportCSV(colsToExport);
        }
        break;
      case "JSON":
        if (onExportJSON) {
          onExportJSON(colsToExport);
        } else {
          defaultExportJSON(colsToExport);
        }
        break;
      case "XLSX":
        if (onExportExcel) {
          onExportExcel(colsToExport);
        } else {
          defaultExportExcel(colsToExport);
        }
        break;
      case "PDF":
        if (onExportPDF) {
          onExportPDF(colsToExport);
        } else {
          // PDF export would require jsPDF library
          console.warn("PDF export requires jsPDF library");
        }
        break;
    }
    setShowColumnDialog(false);
    setSelectedFormat(null);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const selectAllColumns = () => {
    setSelectedColumns(new Set(columns.map((col) => col.key)));
  };

  const deselectAllColumns = () => {
    setSelectedColumns(new Set());
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("CSV")} className="gap-2">
            <FileText className="h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("JSON")} className="gap-2">
            <FileText className="h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("XLSX")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export as Excel (XLSX)
          </DropdownMenuItem>
          {onExportPDF && (
            <DropdownMenuItem onClick={() => handleExport("PDF")} className="gap-2">
              <FileDown className="h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Selection Dialog */}
      {allowColumnSelection && (
        <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Columns to Export</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Columns</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllColumns}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllColumns}
                    className="text-xs"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      id={`col-${column.key}`}
                      checked={selectedColumns.has(column.key)}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={`col-${column.key}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {column.header}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedColumns.size === 0 && (
                <p className="text-sm text-red-500">
                  Please select at least one column
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowColumnDialog(false);
                  setSelectedFormat(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedFormat && selectedColumns.size > 0) {
                    executeExport(selectedFormat, Array.from(selectedColumns));
                  }
                }}
                disabled={selectedColumns.size === 0}
                className="bg-[#FFC905] hover:bg-[#FFC905]/90"
              >
                Export {selectedFormat}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
