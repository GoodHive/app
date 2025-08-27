"use client";

import { Button } from "@/app/components/button";
import { Dialog } from "@headlessui/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Update the Spinner component
const Spinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="relative w-10 h-10">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200"></div>
      <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-[#FFC905] border-t-transparent animate-spin"></div>
    </div>
  </div>
);

interface Admin {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

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

  const fetchAdmins = useCallback(async () => {
    setLoading(true); // Set loading to true when fetching starts
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/admins", {
        headers,
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false); // Set loading to false when fetching ends
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("formData", formData);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setIsOpen(false);
        setFormData({ name: "", email: "", password: "" });
        fetchAdmins();
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (error) {
      setError("Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Admins</h1>
        <Button
          text="Create New Admin"
          type="primary"
          size="medium"
          onClickHandler={() => setIsOpen(true)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
            </tr>
          </thead>
          {loading ? (
            <tbody>
              <tr>
                <td colSpan={3}>
                  <Spinner />
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{admin.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{admin.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-8">
            <Dialog.Title className="text-lg font-medium mb-4">
              Create New Admin
            </Dialog.Title>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent"
                    required
                  />
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="flex justify-end gap-3">
                  <Button
                    text="Cancel"
                    type="secondary"
                    size="medium"
                    onClickHandler={() => setIsOpen(false)}
                  />
                  <Button
                    text={loading ? "Creating..." : "Create Admin"}
                    type="primary"
                    size="medium"
                    disabled={loading}
                    onClickHandler={handleSubmit}
                  />
                </div>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
