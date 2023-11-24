import React from "react";
import { SearchFilters } from "@/app/components/search-filters";

export default function SearchTalentsLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <main className="mx-5">
      <SearchFilters isSearchTalent />

      {children}
    </main>
  );
}
