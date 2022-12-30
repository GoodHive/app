import Head from "next/head";
import Link from "next/link";

import { Navbar } from "../../components/Navbar";

export default function LookForTalent() {

  return (
    <div>
      <Head>
        <title>GoodHive | Talent Search</title>
        <meta name="description" content="Find a job" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="mx-16">
        <h1 className="text-2xl">Look For Talent Page</h1>
      </main>

      <footer className="mx-16">
        <Link
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by GoodHive
        </Link>
      </footer>
    </div>
  )
}
