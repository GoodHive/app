"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { gaPageview, getGaTrackingId } from "@/lib/ga";

export function GAListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gaTrackingId = getGaTrackingId();
  const lastTrackedUrl = useRef<string | undefined>();

  useEffect(() => {
    if (!gaTrackingId) {
      return;
    }

    const search = searchParams.toString();
    const nextUrl = search ? `${pathname}?${search}` : pathname;

    if (lastTrackedUrl.current === nextUrl) {
      return;
    }

    lastTrackedUrl.current = nextUrl;
    gaPageview(nextUrl);
  }, [gaTrackingId, pathname, searchParams]);

  return null;
}
