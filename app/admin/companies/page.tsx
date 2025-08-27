"use client";

import { ConfirmationPopup } from "@/app/components/ConfirmationPopup/ConfirmationPopup";
import Spinner from "@/app/components/Spinner/Spinner";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import Image from "next/image";
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Approval popup state
  const [selectedUser, setSelectedUser] = useState<Company | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchAllCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies");
      const company_data = await response.json();
      setCompanies(company_data);
      setFilteredCompanies(company_data);
    } catch (error) {
      console.log("💥", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  useEffect(() => {
    const filtered = companies?.filter((company) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        company.email?.toLowerCase().includes(searchLower) ||
        company.user_id?.toLowerCase().includes(searchLower) ||
        company.wallet_address?.toLowerCase().includes(searchLower) ||
        company.designation?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredCompanies(filtered || []);
    setCurrentPage(1);
  }, [searchQuery, companies]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTalents = filteredCompanies.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            All Companies Under GoodHive's System
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredCompanies.length} companies
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative bg-white rounded-lg">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, wallet address, or user ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table className="bg-white rounded-lg max-h-[75vh] p-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Company Info</TableHead>
              <TableHead className="w-[15%]">Email</TableHead>
              <TableHead className="w-[15%]">Phone</TableHead>
              <TableHead className="w-[15%]">Address</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Spinner />
                </TableCell>
              </TableRow>
            ) : currentTalents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              currentTalents.map((company) => (
                <TableRow key={company.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-12 w-12">
                        {company.image_url ? (
                          <Image
                            src={company.image_url}
                            alt={company.designation}
                            width={46}
                            height={46}
                            className="h-12 w-12"
                          />
                        ) : (
                          <AvatarFallback>
                            {company.designation?.[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {company.designation}
                        </span>
                        {/* <span className="text-sm text-muted-foreground">
                          {company.headline}
                        </span> */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>{`+${company.phone_country_code} ${company.phone_number}`}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{company.city}</span>
                      <span className="text-sm text-muted-foreground">
                        <Image
                          src={generateCountryFlag(company.country)}
                          alt={company.country}
                          height={20}
                          width={20}
                          className="mt-2"
                        />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        company.approved ? "bg-green-500" : "bg-orange-500"
                      } text-white`}
                    >
                      {company.approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Delete company"
                        onClick={() => {
                          setUserToDelete(company.user_id);
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
                          window.open(
                            `/admin/company/${company.user_id}`,
                            "_blank",
                          );
                        }}
                      >
                        Company Profile
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
          <span className="font-medium">
            {Math.min(indexOfLastItem, filteredCompanies.length)}
          </span>{" "}
          of <span className="font-medium">{filteredCompanies.length}</span>{" "}
          results
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Go to previous page</span>
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Go to next page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
