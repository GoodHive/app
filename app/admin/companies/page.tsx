"use client";

import { ConfirmationPopup } from "@/app/components/ConfirmationPopup/ConfirmationPopup";
import { EditCompanyModal } from "@/app/components/admin/EditCompanyModal";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Company {
  address: string;
  approved: boolean;
  city: string;
  country: string;
  designation: string;
  email: string;
  github: string | null;
  headline: string;
  image_url: string;
  inreview: boolean;
  linkedin: string | null;
  phone_country_code: string;
  phone_number: string;
  portfolio: string | null;
  stackoverflow: string | null;
  status: string;
  telegram: string;
  twitter: string | null;
  user_id: string;
  wallet_address: string | null;
}

export default function AdminManageCompanies() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
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

  const fetchAllCompanies = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/companies", { headers });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const company_data = await response.json();
      setCompanies(company_data);
    } catch (error) {
      console.log("💥", error);
      toast.error("Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  const handleDeleteCompany = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/companies/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete company");
      }

      toast.success("Company deleted successfully");
      setShowDeleteConfirm(false);
      await fetchAllCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete company",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (updatedCompany: Company) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/companies/${updatedCompany.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedCompany),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      toast.success("Company updated successfully");
      await fetchAllCompanies();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Company>[] = [
    {
      key: "designation",
      header: "Company Info",
      width: "20%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-12 w-12">
            {row.image_url ? (
              <Image
                src={row.image_url}
                alt={row.designation}
                width={46}
                height={46}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <AvatarFallback>{row.designation?.[0]}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{row.designation}</span>
          </div>
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
      key: "phone",
      header: "Phone",
      width: "15%",
      render: (value, row) => `+${row.phone_country_code} ${row.phone_number}`,
    },
    {
      key: "address",
      header: "Address",
      width: "15%",
      render: (value, row) => (
        <div className="flex flex-col">
          <span>{row.city}</span>
          <img
            src={generateCountryFlag(row.country)}
            alt={row.country}
            height={20}
            width={20}
            className="mt-1"
          />
        </div>
      ),
    },
    {
      key: "approved",
      header: "Status",
      width: "15%",
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
      width: "20%",
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit company"
            onClick={() => {
              setEditingCompany(row);
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
            title="Delete company"
            onClick={() => {
              setUserToDelete(row.user_id);
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
              window.open(`/admin/company/${row.user_id}`, "_blank");
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
        onConfirm={() => userToDelete && handleDeleteCompany(userToDelete)}
        title="Delete Company"
        description="Are you sure you want to delete this company? This action cannot be undone."
        loading={loading}
      />
      <EditCompanyModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        company={editingCompany}
        onSave={handleSaveCompany}
      />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            All Companies Under GoodHive's System
          </h2>
          <p className="text-sm text-muted-foreground">
            {companies.length} companies
          </p>
        </div>
      </div>

      <EnhancedTable
        data={companies}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search by email, designation, user ID, or wallet address..."
        pagination={true}
        itemsPerPage={10}
        exportable={true}
        loading={loading}
        emptyMessage="No companies found"
      />
    </div>
  );
}
