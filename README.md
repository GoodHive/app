This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

[http://localhost:3000/api/hello](http://localhost:3000/api/hello) is an endpoint that uses [Route Handlers](https://beta.nextjs.org/docs/routing/route-handlers). This endpoint can be edited in `app/api/hello/route.ts`.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Google Analytics (GA4)

- Set `NEXT_PUBLIC_GA_ID` in `.env.local` (included by default with the current measurement ID) to enable tracking. Without this value the Google Tag script stays disabled.
- The GA loader script and manual pageview trigger live in `app/layout.tsx`, with the router listener implemented in `app/ga-listener.tsx`. Shared helpers for firing pageviews and events are available via `lib/ga.ts`.
- Fire custom events anywhere in the app by importing the helper: 
  ```ts
  import { gaEvent } from "@/lib/ga";

  gaEvent("purchase_click", { value: 1 });
  ```
- Optional consent mode example (kept commented by default):
  ```ts
  // window.gtag?.("consent", "default", { ad_user_data: "denied", ad_personalization: "denied", ad_storage: "denied", analytics_storage: "denied" });
  // window.gtag?.("consent", "update", { analytics_storage: "granted" });
  ```
- To verify tracking locally, run the dev server, navigate between pages, and watch for single `collect` hits in DevTools Network tab or confirm activity in GA DebugView.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Database

TABLE goodhive.companies (
id SERIAL PRIMARY KEY,
headline VARCHAR(255) NOT NULL,
designation VARCHAR(100) NOT NULL,
address VARCHAR(100) NOT NULL,
country VARCHAR(100) NOT NULL,
city VARCHAR(100) NOT NULL,
phone_country_code VARCHAR(10) NOT NULL,
phone_number VARCHAR(20) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
telegram VARCHAR(255),
details TEXT NOT NULL,
image_url VARCHAR(255)
);

TABLE goodhive.users (
id SERIAL PRIMARY KEY,
title VARCHAR(100) NOT NULL,
description VARCHAR(255) NOT NULL,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100) NOT NULL,
country VARCHAR(100) NOT NULL,
city VARCHAR(100) NOT NULL,
phone_country_code VARCHAR(10) NOT NULL,
phone_number VARCHAR(20) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
telegram VARCHAR(255),
currency VARCHAR(100),
rate VARCHAR(20),
about_work TEXT NOT NULL,
skills VARCHAR(255) NOT NULL,
image_url VARCHAR (255)
);

TABLE goodhive.users_experience (
id SERIAL PRIMARY KEY,
title VARCHAR(100) NOT NULL,
type_employment VARCHAR(100),
designation VARCHAR(100) NOT NULL,
address VARCHAR(100) NOT NULL,
contract_start VARCHAR(100) NOT NULL,
contract_end VARCHAR(100) NOT NULL,
description VARCHAR(255),
skills VARCHAR(255)
);

TABLE goodhive.job_offers (
id SERIAL PRIMARY KEY,
title VARCHAR(100) NOT NULL,
type_engagement VARCHAR(20) NOT NULL,
description VARCHAR(255),
duration VARCHAR(100) NOT NULL,
rate_per_hour INT,
budget VARCHAR(100),
skills VARCHAR(255),
currency VARCHAR(100)
);

TABLE goodhive.users_education (
id SERIAL PRIMARY KEY,
school VARCHAR(100) NOT NULL,
degree VARCHAR(100) NOT NULL,
filed VARCHAR(100) NOT NULL,
location VARCHAR(100) NOT NULL,
start_date VARCHAR(100) NOT NULL,
end_date VARCHAR(100) NOT NULL,
description VARCHAR(255),
distinction VARCHAR(100)
);
