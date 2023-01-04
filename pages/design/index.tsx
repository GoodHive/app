import Head from "next/head";
import Link from "next/link";

import { NavBar } from "../../components/nav-bar";
import { Buttons } from "../../components/buttons"

export default function Design() {
  
  return (
    <div>
      <Head>
        <title>GoodHive | Design System</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavBar />

      <main className="mx-16">
        <h1 className="text-3xl font-bold">Design System</h1>

        <h2 className="text-2xl font-bold">Typography</h2>

        <p>Headline 1</p>
        <p>Title 2</p>
        <p>Title 3</p>
        <p>Body</p>

        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="container max-w-7xl mx-auto px-6 py-5 md:px-0">
          <div className="flex">
            <div className="grid justify-items-center mx-10">
              <h3 className="text-xl font-semibold">Primary Buttons</h3>
              <Buttons text="Large" type="primary" size="large"></Buttons>
              <Buttons text="Medium" type="primary" size="medium"></Buttons>
            </div>
            <div className="grid justify-items-center mx-10">
              <h3 className="text-xl font-semibold">Secondary Buttons</h3>
              <Buttons text="Large" type="secondary" size="large"></Buttons>
              <Buttons text="Medium" type="secondary" size="medium"></Buttons>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold">Navbar</h2>

        <h3 className="text-xl font-bold">Logo</h3>

        <h3 className="text-xl font-bold">Links</h3>

        <h3 className="text-xl font-bold">Metamask</h3>
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
