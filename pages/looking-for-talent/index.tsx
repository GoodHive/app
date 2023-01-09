import Head from "next/head";
import Link from "next/link";

import { NavBar } from "../../components/nav-bar";

export default function LookingForTalent() {

  return (
    <div>
      <Head>
        <title>GoodHive | Talent Search</title>
        <meta name="description" content="Find a job" />
        <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavBar />

      <main className="mx-5">
        <h1 className="my-5 text-2xl">Looking For Talent Page</h1>
      </main>

      <footer className="mx-5 text-sm">
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
