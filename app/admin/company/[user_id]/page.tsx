"use client";

import { useEffect, useState } from "react";
import CompanyAdminView from "@/app/components/CompanyAdminView/CompanyAdminView";
import { EditCompanyModal } from "@/app/components/admin/EditCompanyModal";
import { ActionHistory } from "@/app/components/admin/ActionHistory";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CompanyAdminViewProfileProps = {
  params: {
    user_id: string;
  };
};

export default function CompaniesPage({
  params,
}: CompanyAdminViewProfileProps) {
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user_id } = params;

  useEffect(() => {
    fetchData();
  }, [user_id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/company?user_id=${user_id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch company data");
      }
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error("Error fetching company data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedCompany: any) => {
    try {
      const response = await fetch(`/api/admin/companies/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCompany),
      });

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      toast.success("Company updated successfully");
      await fetchData();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC905]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!company) {
    return <div>No company data found</div>;
  }

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Company Details</h1>
        <Button
          variant="outline"
          onClick={() => setShowEditModal(true)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Company
        </Button>
      </div>

      <CompanyAdminView {...company} />

      <Card>
        <CardHeader>
          <CardTitle>Action History</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionHistory targetType="company" targetId={user_id} />
        </CardContent>
      </Card>

      <EditCompanyModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        company={company}
        onSave={handleSave}
      />
    </div>
  );
}
