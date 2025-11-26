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
import { ProfileData } from "@/app/talents/my-profile/page";

interface EditTalentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: ProfileData | null;
  onSave: (talent: ProfileData) => Promise<void>;
}

export function EditTalentModal({
  open,
  onOpenChange,
  talent,
  onSave,
}: EditTalentModalProps) {
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (talent) {
      setFormData({
        first_name: talent.first_name || "",
        last_name: talent.last_name || "",
        email: talent.email || "",
        title: talent.title || "",
        description: talent.description || "",
        country: talent.country || "",
        city: talent.city || "",
        phone_country_code: talent.phone_country_code || "",
        phone_number: talent.phone_number || "",
        about_work: talent.about_work || "",
        rate: talent.rate || 0,
        freelance_only: talent.freelance_only || false,
        remote_only: talent.remote_only || false,
        skills: talent.skills || "",
        linkedin: talent.linkedin || "",
        github: talent.github || "",
        twitter: talent.twitter || "",
        stackoverflow: talent.stackoverflow || "",
        portfolio: talent.portfolio || "",
        telegram: talent.telegram || "",
        approved: talent.approved || false,
        talent: talent.talent || false,
        mentor: talent.mentor || false,
        recruiter: talent.recruiter || false,
      });
    }
  }, [talent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talent) return;

    try {
      setLoading(true);
      await onSave({ ...talent, ...formData } as ProfileData);
      toast.success("Talent updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update talent");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!talent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Talent</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                value={formData.rate || 0}
                onChange={(e) =>
                  setFormData({ ...formData, rate: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                value={formData.skills || ""}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="Comma-separated skills"
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
              <Label htmlFor="portfolio">Portfolio</Label>
              <Input
                id="portfolio"
                value={formData.portfolio || ""}
                onChange={(e) =>
                  setFormData({ ...formData, portfolio: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="talent">Talent Role</Label>
              <Switch
                id="talent"
                checked={formData.talent || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, talent: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mentor">Mentor Role</Label>
              <Switch
                id="mentor"
                checked={formData.mentor || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, mentor: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="recruiter">Recruiter Role</Label>
              <Switch
                id="recruiter"
                checked={formData.recruiter || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, recruiter: checked })
                }
              />
            </div>
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
