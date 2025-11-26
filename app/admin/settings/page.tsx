"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Database, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    approvalAlerts: true,
    weeklyReports: false,
    errorAlerts: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || notifications);
        setSystemSettings(data.system || systemSettings);
        setSecuritySettings(data.security || securitySettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifications,
          system: systemSettings,
          security: securitySettings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your admin panel preferences and system configuration
        </p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#FFC905]" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive email updates for important events
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, emailNotifications: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="approval-alerts">Approval Alerts</Label>
              <p className="text-sm text-gray-500">
                Get notified when new approvals are needed
              </p>
            </div>
            <Switch
              id="approval-alerts"
              checked={notifications.approvalAlerts}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, approvalAlerts: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-gray-500">
                Receive weekly summary reports
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, weeklyReports: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="error-alerts">Error Alerts</Label>
              <p className="text-sm text-gray-500">
                Get notified about system errors
              </p>
            </div>
            <Switch
              id="error-alerts"
              checked={notifications.errorAlerts}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, errorAlerts: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#FFC905]" />
            <CardTitle>System Settings</CardTitle>
          </div>
          <CardDescription>
            Configure system-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <p className="text-sm text-gray-500">
                Temporarily disable the platform for maintenance
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={systemSettings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSystemSettings({ ...systemSettings, maintenanceMode: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-registrations">Allow New Registrations</Label>
              <p className="text-sm text-gray-500">
                Enable or disable new user registrations
              </p>
            </div>
            <Switch
              id="allow-registrations"
              checked={systemSettings.allowRegistrations}
              onCheckedChange={(checked) =>
                setSystemSettings({ ...systemSettings, allowRegistrations: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-verification">Require Email Verification</Label>
              <p className="text-sm text-gray-500">
                Require users to verify their email addresses
              </p>
            </div>
            <Switch
              id="email-verification"
              checked={systemSettings.requireEmailVerification}
              onCheckedChange={(checked) =>
                setSystemSettings({ ...systemSettings, requireEmailVerification: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#FFC905]" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Manage security and access control settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: Number(e.target.value),
                })
              }
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Automatically log out admins after inactivity
            </p>
          </div>
          <Separator />
          <div>
            <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
            <Input
              id="max-login-attempts"
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  maxLoginAttempts: Number(e.target.value),
                })
              }
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of failed login attempts before account lockout
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

