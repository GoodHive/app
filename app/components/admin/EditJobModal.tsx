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
import { IJobOffer } from "@/interfaces/job-offer";

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: IJobOffer | null;
  onSave: (job: IJobOffer) => Promise<void>;
}

export function EditJobModal({
  open,
  onOpenChange,
  job,
  onSave,
}: EditJobModalProps) {
  const [formData, setFormData] = useState<Partial<IJobOffer>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        company_name: job.company_name || "",
        type_engagement: job.type_engagement || "",
        duration: job.duration || "",
        budget: job.budget || "",
        chain: job.chain || "",
        currency: job.currency || "",
        skills: job.skills || "",
        city: job.city || "",
        country: job.country || "",
        job_type: job.job_type || "",
        project_type: job.project_type || "",
        published: job.published || false,
      });
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    try {
      setLoading(true);
      await onSave({ ...job, ...formData } as IJobOffer);
      toast.success("Job updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update job");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                required
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
              <Label htmlFor="type_engagement">Engagement Type</Label>
              <Input
                id="type_engagement"
                value={formData.type_engagement || ""}
                onChange={(e) =>
                  setFormData({ ...formData, type_engagement: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration || ""}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                value={formData.budget || ""}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency || ""}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="chain">Chain</Label>
              <Input
                id="chain"
                value={formData.chain || ""}
                onChange={(e) =>
                  setFormData({ ...formData, chain: e.target.value })
                }
              />
            </div>
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
              <Label htmlFor="job_type">Job Type</Label>
              <Input
                id="job_type"
                value={formData.job_type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, job_type: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="project_type">Project Type</Label>
              <Input
                id="project_type"
                value={formData.project_type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, project_type: e.target.value })
                }
              />
            </div>
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

          <div className="flex items-center justify-between">
            <Label htmlFor="published">Published Status</Label>
            <Switch
              id="published"
              checked={formData.published || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, published: checked })
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
