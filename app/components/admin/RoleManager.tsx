"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserPlus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
}

interface RoleManagerProps {
  roles: Role[];
  onUpdateRole: (roleId: string, permissions: string[]) => Promise<void>;
  onCreateRole: (name: string, permissions: string[]) => Promise<void>;
}

const AVAILABLE_PERMISSIONS = [
  { id: "users.view", label: "View Users" },
  { id: "users.edit", label: "Edit Users" },
  { id: "users.delete", label: "Delete Users" },
  { id: "talents.approve", label: "Approve Talents" },
  { id: "companies.approve", label: "Approve Companies" },
  { id: "jobs.manage", label: "Manage Jobs" },
  { id: "analytics.view", label: "View Analytics" },
  { id: "settings.manage", label: "Manage Settings" },
  { id: "admins.manage", label: "Manage Admins" },
];

export function RoleManager({
  roles,
  onUpdateRole,
  onCreateRole,
}: RoleManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePermissionToggle = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(
        selectedPermissions.filter((id) => id !== permissionId),
      );
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    try {
      setLoading(true);
      await onCreateRole(newRoleName, selectedPermissions);
      toast.success("Role created successfully");
      setShowCreateDialog(false);
      setNewRoleName("");
      setSelectedPermissions([]);
    } catch (error) {
      toast.error("Failed to create role");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (role: Role) => {
    try {
      setLoading(true);
      await onUpdateRole(role.id, selectedPermissions);
      toast.success("Role updated successfully");
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (error) {
      toast.error("Failed to update role");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{role.name}</h4>
                {role.description && (
                  <p className="text-sm text-gray-600">{role.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(role)}
              >
                Edit
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((perm) => {
                const permLabel =
                  AVAILABLE_PERMISSIONS.find((p) => p.id === perm)?.label ||
                  perm;
                return (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {permLabel}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Moderator, Editor"
                required
              />
            </div>
            <div>
              <Label>Permissions *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handlePermissionToggle(permission.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="rounded"
                    />
                    <Label className="cursor-pointer">{permission.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewRoleName("");
                setSelectedPermissions([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={loading}>
              {loading ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={selectedRole !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRole(null);
            setSelectedPermissions([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handlePermissionToggle(permission.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="rounded"
                    />
                    <Label className="cursor-pointer">{permission.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRole(null);
                setSelectedPermissions([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedRole && handleUpdateRole(selectedRole)}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
