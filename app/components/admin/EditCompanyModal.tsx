"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface Company {
  user_id: string;
  designation: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  address: string;
  city: string;
  country: string;
  headline: string;
  approved: boolean;
  inreview: boolean;
  status: string;
  image_url: string;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  telegram: string;
  portfolio: string | null;
  stackoverflow: string | null;
  wallet_address: string | null;
}

interface EditCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSave: (company: Company) => Promise<void>;
}

export function EditCompanyModal({
  open,
  onOpenChange,
  company,
  onSave,
}: EditCompanyModalProps) {
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      setLoading(true);
      await onSave({ ...company, ...formData } as Company);
      toast.success("Company updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update company");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designation">Company Name *</Label>
              <Input
                id="designation"
                value={formData.designation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_country_code">Country Code</Label>
              <Input
                id="phone_country_code"
                value={formData.phone_country_code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone_country_code: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={formData.headline || ""}
              onChange={(e) =>
                setFormData({ ...formData, headline: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country || ""}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin || ""}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formData.github || ""}
                onChange={(e) =>
                  setFormData({ ...formData, github: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.twitter || ""}
                onChange={(e) =>
                  setFormData({ ...formData, twitter: e.target.value })
                }
              />
            </div>
          <div>
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              value={formData.telegram || ""}
              onChange={(e) =>
                setFormData({ ...formData, telegram: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="approved">Approved Status</Label>
            <Switch
              id="approved"
              checked={formData.approved || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, approved: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
