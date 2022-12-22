import Head from 'next/head'
import { Navbar } from '../components/Navbar'

// import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div>
      <Head>
        <title>GoodHive</title>
        <meta name="description" content="Find a job" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main>
        <h1 className="text-xl">Home Page</h1>

        <p>Get started by clicking on Design</p>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by GoodHive
        </a>
      </footer>
    </div>
  )
}
