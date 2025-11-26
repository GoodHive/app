"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Save } from "lucide-react";
import toast from "react-hot-toast";

interface Permission {
  id: string;
  label: string;
  category: string;
  description?: string;
}

interface UserPermissions {
  userId: string;
  permissions: string[];
}

interface PermissionsEditorProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  availablePermissions: Permission[];
  currentPermissions: string[];
  onSave: (userId: string, permissions: string[]) => Promise<void>;
}

const PERMISSION_CATEGORIES = [
  { id: "users", label: "User Management" },
  { id: "content", label: "Content Management" },
  { id: "approvals", label: "Approvals" },
  { id: "analytics", label: "Analytics & Reports" },
  { id: "system", label: "System Settings" },
];

export function PermissionsEditor({
  user,
  availablePermissions,
  currentPermissions,
  onSave,
}: PermissionsEditorProps) {
  const [selectedPermissions, setSelectedPermissions] =
    useState<string[]>(currentPermissions);
  const [loading, setLoading] = useState(false);

  const handlePermissionToggle = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(
        selectedPermissions.filter((id) => id !== permissionId)
      );
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  const handleCategoryToggle = (categoryId: string, enable: boolean) => {
    const categoryPermissions = availablePermissions
      .filter((p) => p.category === categoryId)
      .map((p) => p.id);

    if (enable) {
      setSelectedPermissions([
        ...new Set([...selectedPermissions, ...categoryPermissions]),
      ]);
    } else {
      setSelectedPermissions(
        selectedPermissions.filter((id) => !categoryPermissions.includes(id))
      );
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(user.id, selectedPermissions);
      toast.success("Permissions updated successfully");
    } catch (error) {
      toast.error("Failed to update permissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsByCategory = (categoryId: string) => {
    return availablePermissions.filter((p) => p.category === categoryId);
  };

  const isCategoryEnabled = (categoryId: string) => {
    const categoryPermissions = getPermissionsByCategory(categoryId).map(
      (p) => p.id
    );
    return categoryPermissions.every((id) =>
      selectedPermissions.includes(id)
    );
  };

  const hasChanges = () => {
    if (selectedPermissions.length !== currentPermissions.length) return true;
    return !selectedPermissions.every((id) =>
      currentPermissions.includes(id)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Edit Permissions: {user.name}
        </CardTitle>
        <p className="text-sm text-gray-600">{user.email}</p>
        {user.role && (
          <Badge variant="outline" className="w-fit">
            Role: {user.role}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {PERMISSION_CATEGORIES.map((category) => {
          const categoryPermissions = getPermissionsByCategory(category.id);
          const categoryEnabled = isCategoryEnabled(category.id);

          return (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-base font-semibold">
                  {category.label}
                </Label>
                <Switch
                  checked={categoryEnabled}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle(category.id, checked)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {categoryPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <Label
                        htmlFor={permission.id}
                        className="cursor-pointer font-medium"
                      >
                        {permission.label}
                      </Label>
                      {permission.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {permission.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() =>
                        handlePermissionToggle(permission.id)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedPermissions.length} permission(s) selected
          </div>
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges()}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

