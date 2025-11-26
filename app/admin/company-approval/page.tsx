"use client";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { AdminTable } from "@/app/components/admin/AdminTable";
import { BulkApproval } from "@/app/components/admin/BulkApproval";
import { SearchInput } from "@/app/components/admin/SearchInput";
import { Spinner } from "@/app/components/admin/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ApprovalPopup from "./components/ApprovalPopup";

interface Company {
  user_id: string;
  headline: string;
  email: string;
  city: string;
  country: string;
  designation: string;
  approved: boolean;
}

export default function AdminCompanyApproval() {
  const [users, setUsers] = useState<Company[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Company | null>(null);
  const [selectedItems, setSelectedItems] = useState<Company[]>([]);
  const [showBulkApproval, setShowBulkApproval] = useState(false);

  const handleApproveClick = (user: Company) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const toggleItemSelection = (user: Company) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.user_id === user.user_id);
      if (exists) {
        return prev.filter((item) => item.user_id !== user.user_id);
      } else {
        return [...prev, user];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredUsers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredUsers]);
    }
  };

  const handleBulkApprove = async (itemIds: string[]) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies/bulk-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: itemIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve companies");
      }

      toast.success(`Successfully approved ${itemIds.length} company(ies)`);
      setSelectedItems([]);
      fetchPendingUsers();
    } catch (error) {
      console.error("Error approving companies:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async (itemIds: string[], reason?: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies/bulk-reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: itemIds,
          reason: reason || "Rejected by admin",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject companies");
      }

      toast.success(`Successfully rejected ${itemIds.length} company(ies)`);
      setSelectedItems([]);
      fetchPendingUsers();
    } catch (error) {
      console.error("Error rejecting companies:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "select",
      header: "",
      width: "5%",
      render: (value: any, row: Company) => (
        <Checkbox
          checked={selectedItems.some((item) => item.user_id === row.user_id)}
          onCheckedChange={() => toggleItemSelection(row)}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "headline",
      header: "Headline",
      width: "27%",
      render: (value: any, row: Company) => {
        const cleanHeadline = row.headline?.replace(/<[^>]*>?/gm, "") || "";
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="font-medium" title={cleanHeadline}>
                {cleanHeadline.length > 25
                  ? `${cleanHeadline.substring(0, 25)}...`
                  : cleanHeadline}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "10%",
      render: () => (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pending
        </Badge>
      ),
    },
    {
      key: "email",
      header: "Email",
      width: "23%",
    },
    {
      key: "location",
      header: "Location",
      width: "18%",
      render: (value: any, row: Company) => (
        <span>
          {row.city}, {row.country}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "12%",
      render: (value: any, row: Company) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  window.open(`/admin/company/${row.user_id}`, "_blank");
                }}
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleApproveClick(row);
                }}
              >
                Approve
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies/pending");
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const searchStr =
        `${user.headline} ${user.email} ${user.city} ${user.country}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
    setFilteredUsers(filtered);
    // Clear selection when filtering
    setSelectedItems((prev) =>
      prev.filter((item) =>
        filtered.some((user) => user.user_id === item.user_id),
      ),
    );
  }, [searchQuery, users]);

  return (
    <AdminPageLayout
      title="Company Join Requests"
      subtitle="Review and approve company applications"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, city, or country..."
          />
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkApproval(true)}
              >
                Bulk Actions
              </Button>
            </div>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className="bg-[#FFC905]/10 border border-[#FFC905] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.length === filteredUsers.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-gray-900">
                Select All ({filteredUsers.length})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkApproval(true)}
            >
              Manage Selected ({selectedItems.length})
            </Button>
          </div>
        )}

        {loading ? (
          <div className="py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <AdminTable
              columns={columns}
              data={filteredUsers}
              // onRowClick={(row) =>
              //   window.open(`/admin/company/${row.user_id}`, "_blank")
              // }
            />
            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No pending requests found
              </div>
            )}
          </>
        )}
      </div>

      {selectedUser && (
        <ApprovalPopup
          open={showApprovePopup}
          setOpen={setShowApprovePopup}
          user={selectedUser}
          fetchData={fetchPendingUsers}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      <BulkApproval
        open={showBulkApproval}
        onOpenChange={setShowBulkApproval}
        selectedItems={selectedItems}
        entityType="company"
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
      />
    </AdminPageLayout>
  );
}
