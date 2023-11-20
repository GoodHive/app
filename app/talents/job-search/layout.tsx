import { SearchFilters } from "@/app/components/search-filters";
import React from "react";

export default function JobSearchLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <main className="mx-5">
      <SearchFilters />

      {children}
    </main>
  );
}
