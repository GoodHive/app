const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const gaPageview = (url: string) => {
  if (!GA_TRACKING_ID) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

export const gaEvent = (
  action: string,
  params: Record<string, unknown> = {}
) => {
  if (!GA_TRACKING_ID) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", action, params);
};

export const getGaTrackingId = () => GA_TRACKING_ID;

// Example: enabling Consent Mode once visitors opt in.
// window.gtag?.("consent", "default", { ad_user_data: "denied", ad_personalization: "denied", ad_storage: "denied", analytics_storage: "denied" });
// window.gtag?.("consent", "update", { analytics_storage: "granted" });
