"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface BulkApprovalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: any[];
  entityType: "talent" | "company";
  onApprove: (itemIds: string[], approvalTypes?: Record<string, boolean>) => Promise<void>;
  onReject: (itemIds: string[], reason?: string) => Promise<void>;
}

export function BulkApproval({
  open,
  onOpenChange,
  selectedItems,
  entityType,
  onApprove,
  onReject,
}: BulkApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalTypes, setApprovalTypes] = useState({
    talent: false,
    mentor: false,
    recruiter: false,
  });

  const handleApprove = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }

    try {
      setLoading(true);
      const itemIds = selectedItems.map((item) => item.user_id || item.id);
      
      if (entityType === "talent") {
        await onApprove(itemIds, approvalTypes);
      } else {
        await onApprove(itemIds);
      }
      
      toast.success(`Successfully approved ${selectedItems.length} ${entityType}(s)`);
      onOpenChange(false);
      setAction(null);
    } catch (error) {
      toast.error("Failed to approve items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      const itemIds = selectedItems.map((item) => item.user_id || item.id);
      await onReject(itemIds, rejectionReason);
      toast.success(`Successfully rejected ${selectedItems.length} ${entityType}(s)`);
      onOpenChange(false);
      setAction(null);
      setRejectionReason("");
    } catch (error) {
      toast.error("Failed to reject items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Bulk Action - {selectedItems.length} {entityType}(s) selected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!action && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Choose an action to perform on {selectedItems.length} selected{" "}
                {entityType}(s):
              </p>
              <div className="flex gap-3">
            <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setAction("approve")}
            >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve All
            </Button>
              <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setAction("reject")}
              >
                  <XCircle className="h-4 w-4" />
                  Reject All
              </Button>
          </div>
        </div>
      )}

          {action === "approve" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Approve Selected Items</span>
              </div>
              {entityType === "talent" && (
                <div className="space-y-3 border rounded-lg p-4">
                  <Label className="text-sm font-medium">
                    Approval Types (for talents):
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bulk-talent" className="text-sm">
                        Talent
                      </Label>
                      <Switch
                        id="bulk-talent"
                        checked={approvalTypes.talent}
                        onCheckedChange={(checked) =>
                          setApprovalTypes({ ...approvalTypes, talent: checked })
                        }
        />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bulk-mentor" className="text-sm">
                        Mentor
                      </Label>
                      <Switch
                        id="bulk-mentor"
                        checked={approvalTypes.mentor}
                        onCheckedChange={(checked) =>
                          setApprovalTypes({ ...approvalTypes, mentor: checked })
                        }
                      />
      </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bulk-recruiter" className="text-sm">
                        Recruiter
                      </Label>
                      <Switch
                        id="bulk-recruiter"
                        checked={approvalTypes.recruiter}
                        onCheckedChange={(checked) =>
                          setApprovalTypes({
                            ...approvalTypes,
                            recruiter: checked,
                          })
                        }
            />
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    This will approve all {selectedItems.length} selected{" "}
                    {entityType}(s). This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {action === "reject" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Reject Selected Items</span>
              </div>
              <div>
                <Label htmlFor="rejection-reason" className="text-sm">
                  Rejection Reason *
                </Label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905] min-h-[100px]"
                  required
                />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <p className="text-xs text-red-800">
                    This will reject all {selectedItems.length} selected{" "}
                    {entityType}(s). This action cannot be undone.
                  </p>
          </div>
      </div>
    </div>
          )}
        </div>

        <DialogFooter>
          {action && (
            <Button
              variant="outline"
              onClick={() => {
                setAction(null);
                setRejectionReason("");
              }}
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {action === "approve" && (
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Approving..." : "Confirm Approval"}
            </Button>
          )}
          {action === "reject" && (
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
