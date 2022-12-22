import Head from 'next/head'
import { Navbar } from '../../components/Navbar'

// import styles from '../styles/Home.module.css'

export default function LookForTalent() {
  return (
    <div>
      <Head>
        <title>GoodHive</title>
        <meta name="description" content="Find a job" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main>
        <h1 className="text-xl">Look For Talent Page</h1>
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
