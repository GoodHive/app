"use client";

import { ConfirmationPopup } from "@/app/components/ConfirmationPopup/ConfirmationPopup";
import { EditTalentModal } from "@/app/components/admin/EditTalentModal";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ApprovalPopup from "../talent-approval/components/ApprovalPopup";

export default function AdminManageTalents() {
  const router = useRouter();
  const [talents, setTalents] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [editingTalent, setEditingTalent] = useState<ProfileData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const getAuthHeaders = () => {
    const token = Cookies.get("admin_token");
    if (!token) {
      router.push("/admin/login");
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchAllTalents = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/talents", { headers });
      
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const talents = await response.json();
      setTalents(talents);
    } catch (error) {
      console.log("💥", error);
      toast.error("Failed to fetch talents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTalents();
  }, []);

  const handleDeleteTalent = async (userId: string) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/talents/${userId}`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete talent");
      }

      toast.success("Talent deleted successfully");
      setShowDeleteConfirm(false);
      await fetchAllTalents();
    } catch (error) {
      console.error("Error deleting talent:", error);
      toast.error("Failed to delete talent");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTalent = async (updatedTalent: ProfileData) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/talents/${updatedTalent.user_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedTalent),
      });

      if (!response.ok) {
        throw new Error("Failed to update talent");
      }

      toast.success("Talent updated successfully");
      await fetchAllTalents();
    } catch (error) {
      console.error("Error updating talent:", error);
      toast.error("Failed to update talent");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<ProfileData>[] = [
    {
      key: "name",
      header: "Talent Name",
      width: "15%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-12 w-12">
            {row.image_url ? (
              <Image
                src={row.image_url}
                alt={`${row.first_name} ${row.last_name}`}
                width={46}
                height={46}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <AvatarFallback>
                {row.first_name?.[0]}
                {row.last_name?.[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="truncate max-w-[150px]">
            {`${row.first_name} ${row.last_name}`}
          </span>
        </div>
      ),
    },
    {
      key: "user_id",
      header: "User ID",
      width: "14%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[100px]">
            {row.user_id
              ? `${row.user_id.slice(0, 5)}...${row.user_id.slice(-5)}`
              : ""}
          </span>
          <button
            title="Copy user ID"
            onClick={() => {
              navigator.clipboard.writeText(row.user_id || "");
              toast.success("User ID copied!");
            }}
            className="hover:text-gray-700"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      width: "15%",
      sortable: true,
    },
    {
      key: "wallet_address",
      header: "Wallet Address",
      width: "12%",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.wallet_address ? (
            <>
              <span className="truncate max-w-[100px]">
                {row.wallet_address}
              </span>
              <button
                title="Copy wallet address"
                onClick={() => {
                  navigator.clipboard.writeText(row.wallet_address || "");
                  toast.success("Wallet address copied!");
                }}
                className="hover:text-gray-700"
              >
                <Copy className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Badge className="bg-orange-500 text-white">Not Available</Badge>
          )}
        </div>
      ),
    },
    {
      key: "talent",
      header: "Talent Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.talent === true ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.talent ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </Badge>
      ),
    },
    {
      key: "mentor",
      header: "Mentor Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.mentor === true ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.mentor ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </Badge>
      ),
    },
    {
      key: "recruiter",
      header: "Recruiter Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.recruiter === true ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.recruiter ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </Badge>
      ),
    },
    {
      key: "approved",
      header: "Account Status",
      width: "8%",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${
            row.approved ? "bg-green-500" : "bg-orange-500"
          } text-white`}
        >
          {row.approved ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "12%",
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit talent"
            onClick={() => {
              setEditingTalent(row);
              setShowEditModal(true);
            }}
            disabled={loading}
          >
            <Pencil className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Approve/Manage roles"
            onClick={() => {
              setSelectedUser(row);
              setShowApprovePopup(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Delete talent"
            onClick={() => {
              setUserToDelete(row.user_id || "");
              setShowDeleteConfirm(true);
            }}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
            onClick={() => {
              window.open(`/admin/talent/${row.user_id}`, "_blank");
            }}
          >
            View Profile
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full mx-auto p-6">
      <ConfirmationPopup
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => userToDelete && handleDeleteTalent(userToDelete)}
        title="Delete Talent"
        description="Are you sure you want to delete this talent? This action cannot be undone."
        loading={loading}
      />
      {selectedUser && (
        <ApprovalPopup
          open={showApprovePopup}
          setOpen={setShowApprovePopup}
          user={selectedUser}
          fetchData={fetchAllTalents}
          setLoading={setLoading}
          loading={loading}
          superView
        />
      )}
      <EditTalentModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        talent={editingTalent}
        onSave={handleSaveTalent}
      />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            All Talents Under GoodHive's System
          </h2>
          <p className="text-sm text-muted-foreground">
            {talents.length} talents
          </p>
        </div>
      </div>

      <EnhancedTable
        data={talents}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search by name, email, user ID, or wallet address..."
        pagination={true}
        itemsPerPage={10}
        exportable={true}
        loading={loading}
        emptyMessage="No talents found"
      />
    </div>
  );
}
