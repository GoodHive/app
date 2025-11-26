"use client";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { Column, EnhancedTable } from "@/app/components/admin/EnhancedTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IJobOffer } from "@/interfaces/job-offer";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function AdminAllJobs() {
  const [jobs, setJobs] = useState<IJobOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/jobs");
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const columns: Column<IJobOffer>[] = [
    {
      key: "image_url",
      header: "Image",
      width: "10%",
      render: (value: any, row: IJobOffer) => (
        <Image
          src={row.image_url || "/img/placeholder.png"}
          alt={row.title}
          width={40}
          height={40}
          className="rounded-full"
        />
      ),
    },
    {
      key: "title",
      header: "Title",
      width: "25%",
      sortable: true,
    },
    {
      key: "company_name",
      header: "Company Name",
      width: "20%",
      sortable: true,
    },
    {
      key: "chain",
      header: "Chain",
      width: "10%",
      sortable: true,
    },
    {
      key: "published",
      header: "Status",
      width: "15%",
      sortable: true,
      render: (value: any, row: IJobOffer) => (
        <Badge variant={row.published ? "default" : "destructive"}>
          {row.published ? "Published" : "Not Published"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "15%",
      render: (value: any, row: IJobOffer) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/admin/job/${row.id}`, "_blank")}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="All Jobs"
      subtitle="Browse and manage all job listings"
    >
      <EnhancedTable
        data={jobs}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search by title, company, or chain..."
        pagination={true}
        itemsPerPage={10}
        exportable={true}
        loading={loading}
        emptyMessage="No jobs found"
      />
    </AdminPageLayout>
  );
}
