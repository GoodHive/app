import Head from "next/head";
import Link from "next/link";

import { NavBar } from "../components/nav-bar";

export default function Home() {

  return (
    <div>
      <Head>
        <title>GoodHive</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavBar />

      <main className="mx-16">
        <h1 className="text-2xl">Home Page</h1>

        <p>Get started by clicking on Design</p>
      </main>

      <footer className="mx-16">
        <Link
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '} GoodHive
        </Link>
      </footer>
    </div>
  )
}
