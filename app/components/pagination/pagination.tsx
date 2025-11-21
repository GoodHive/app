import { FC } from "react";
import Link from "next/link";

import clsx from "clsx";
import { v4 as uuid } from "uuid";

import { PaginationProps } from "./pagination.types";

export const Pagination: FC<PaginationProps> = (props) => {
  const {
    itemsPerPage,
    activePage,
    totalItems,
    query,
    isSearchTalent = false,
  } = props;


  const numberOfPages = Math.ceil(totalItems / itemsPerPage);

  if (numberOfPages === 1) return null;

  const maxPagesToShow = 7;
  const shouldShowDots = numberOfPages > maxPagesToShow;

  const getVisiblePages = () => {
    if (!shouldShowDots) {
      return Array.from({ length: numberOfPages }, (_, i) => i + 1);
    }

    const sidePages = 2;
    if (activePage <= sidePages + 2) {
      return [...Array.from({ length: Math.min(5, numberOfPages) }, (_, i) => i + 1), '...', numberOfPages];
    }
    
    if (activePage >= numberOfPages - (sidePages + 1)) {
      return [1, '...', ...Array.from({ length: Math.min(5, numberOfPages) }, (_, i) => numberOfPages - 4 + i).filter(p => p > 0)];
    }

    return [1, '...', activePage - 1, activePage, activePage + 1, '...', numberOfPages];
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className="flex justify-center items-center space-x-2" aria-label="Pagination">
      {/* Previous Button */}
      {activePage > 1 && (
        <Link
          href={`${isSearchTalent
              ? "/companies/search-talents"
              : "/talents/job-search"}?${new URLSearchParams(
                Object.fromEntries(
                  Object.entries({ ...query, page: (activePage - 1).toString() })
                    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                    .map(([key, value]) => [key, String(value)])
                )
              ).toString()}`}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Link>
      )}

      {/* Page Numbers */}
      <div className="flex space-x-1">
        {visiblePages.map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <span
                key={`dots-${index}`}
                className="flex items-center justify-center w-10 h-10 text-gray-500"
              >
                ...
              </span>
            );
          }

          return (
            <Link
              key={uuid()}
              className={clsx(
                "flex items-center justify-center w-10 h-10 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm",
                activePage === pageNum
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg transform scale-105"
                  : "bg-white text-gray-700 border border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md"
              )}
              href={`${isSearchTalent
                  ? "/companies/search-talents"
                  : "/talents/job-search"}?${new URLSearchParams(
                    Object.fromEntries(
                      Object.entries({ ...query, page: pageNum.toString() })
                        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                        .map(([key, value]) => [key, String(value)])
                    )
                  ).toString()}`}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      {activePage < numberOfPages && (
        <Link
          href={`${isSearchTalent
              ? "/companies/search-talents"
              : "/talents/job-search"}?${new URLSearchParams(
                Object.fromEntries(
                  Object.entries({ ...query, page: (activePage + 1).toString() })
                    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                    .map(([key, value]) => [key, String(value)])
                )
              ).toString()}`}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Next
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </nav>
  );
};
