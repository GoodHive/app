"use client";

import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { Copy, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  userid: string;
  talent_status: "approved" | "pending";
  mentor_status: "approved" | "pending";
  recruiter_status: "approved" | "pending";
  wallet_address?: string;
  last_active: string;
  has_talent_profile: boolean;
}

export default function AdminManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileFilter, setProfileFilter] = useState<
    "all" | "with_profile" | "without_profile"
  >("all");

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

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/users", { headers });
      
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const { users } = await response.json();
      setUsers(users);
    } catch (error) {
      console.log("💥", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Filter users based on profile filter
  const filteredUsers = users.filter(
    (user) =>
      profileFilter === "all" ||
      (profileFilter === "with_profile" && user.has_talent_profile) ||
      (profileFilter === "without_profile" && !user.has_talent_profile),
  );

  const columns: Column<User>[] = [
    {
      key: "email",
      header: "Email",
      width: "20%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {row.email?.charAt(0) || row.wallet_address?.charAt(2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{""}</div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      width: "15%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    {
      key: "wallet_address",
      header: "Wallet Address",
      width: "15%",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.wallet_address ? (
            <>
              <span>
                {row.wallet_address.length > 10
                  ? `${row.wallet_address.slice(0, 10)}...${row.wallet_address.slice(-10)}`
                  : row.wallet_address}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  toast.success("Wallet Address copied to clipboard");
                  navigator.clipboard.writeText(row.wallet_address || "");
                }}
              >
                <Copy className="h-3 w-3 text-gray-500" />
              </Button>
            </>
          ) : (
            <span className="text-gray-400">Not Available</span>
          )}
        </div>
      ),
    },
    {
      key: "userid",
      header: "User ID",
      width: "15%",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>
            {row.userid.length > 10
              ? `${row.userid.slice(0, 10)}...${row.userid.slice(-10)}`
              : row.userid}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              toast.success("User ID copied to clipboard");
              navigator.clipboard.writeText(row.userid);
            }}
          >
            <Copy className="h-3 w-3 text-gray-500" />
          </Button>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Approved Roles",
      width: "20%",
      render: (value, row) => (
        <div className="flex gap-2 flex-wrap">
          {row.mentor_status === "approved" && (
            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
              Mentor
            </Badge>
          )}
          {row.recruiter_status === "approved" && (
            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
              Recruiter
            </Badge>
          )}
          {row.talent_status === "approved" && (
            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
              Talent
            </Badge>
          )}
          {row.mentor_status !== "approved" &&
            row.recruiter_status !== "approved" &&
            row.talent_status !== "approved" && (
              <Badge className="bg-gray-500 text-white hover:bg-gray-600 text-xs">
                No Roles
              </Badge>
            )}
        </div>
      ),
    },
    {
      key: "talent_profile",
      header: "Talent Profile",
      width: "15%",
      render: (value, row) =>
        row.has_talent_profile ? (
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap w-full max-w-[150px] text-white bg-[#FFC905] border border-transparent rounded-md hover:bg-[#FFC905]/80 transition duration-200 ease-in-out"
            onClick={() => {
              window.open(`/admin/talent/${row.userid}`, "_blank");
            }}
          >
            Talent Profile
          </Button>
        ) : (
          <Badge className="bg-gray-600 text-gray-200 hover:bg-gray-500 w-[150px] text-center align-middle justify-center">
            No Talent Profile
          </Badge>
        ),
    },
  ];

  return (
    <div className="w-full mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            All Users Under GoodHive's System
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} users
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 w-fit mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setProfileFilter("all")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            profileFilter === "all"
              ? "bg-[#FFC905] text-black"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setProfileFilter("with_profile")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            profileFilter === "with_profile"
              ? "bg-[#FFC905] text-black"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          With Profile
        </button>
        <button
          onClick={() => setProfileFilter("without_profile")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            profileFilter === "without_profile"
              ? "bg-[#FFC905] text-black"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Without Profile
        </button>
      </div>

      <EnhancedTable
        data={filteredUsers}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search by email, wallet address, user ID, first name, or last name..."
        pagination={true}
        itemsPerPage={10}
        exportable={true}
        loading={loading}
        emptyMessage="No users found"
      />
    </div>
  );
}
