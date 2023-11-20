import { FC } from "react";
import Link from "next/link";

import clsx from "clsx";
import { v4 as uuid } from "uuid";

import { PaginationProps } from "./pagination.types";

export const Pagination: FC<PaginationProps> = (props) => {
  const { itemsPerPage, activePage, totalItems, query, isSearchTalent = false } = props;

  const numberOfPages = Math.ceil(totalItems / itemsPerPage);

  if (numberOfPages === 1) return null;

  return (
    <div className="flex justify-center mt-4 space-x-2">
      {Array.from({ length: numberOfPages }, (_, i) => i + 1).map((pageNum) => (
        <Link
          key={uuid()}
          className={clsx(activePage === pageNum && "text-yellow-400")}
          href={{
            href: isSearchTalent
              ? "/companies/search-talents"
              : "/talents/job-search/",
            query: { ...query, page: pageNum },
          }}
        >
          {pageNum}
        </Link>
      ))}
    </div>
  );
};
