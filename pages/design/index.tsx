import Head from "next/head";
import Link from "next/link";

import { NavBar } from "../../components/nav-bar";
import { Buttons } from "../../components/buttons"
import { Card } from "../../components/card";

export default function Design() {
  
  return (
    <div>
      <Head>
        <title>GoodHive | Design System</title>
        <meta name="description" content="Generated by create next app" />
        <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavBar />

      <main className="mx-14">
        <h1 className="text-3xl font-bold font-montserrat">Design System</h1>

        <section className="mt-5 body-font font-montserrat">
          <h2 className="text-2xl font-bold">Logo</h2>
          <img className="ml-10" src="/img/goodhive_logo.png" alt="Goodhive" />
        </section>

        <section className="mt-5 body-font font-montserrat">
          <h2 className="text-2xl font-bold">Typography</h2>
          <p className="m-3 font-light text-sm">Font family: Montserrat</p>
          <div className="container max-w-7xl mx-auto px-6 py-5 md:px-0">
            <div className="flex">

              <div className="bg-gray-200 grid justify-items-left p-5 mx-10 rounded-lg space-y-2">
                <h3 className="text-xl font-semibold">Headlines</h3>
                <div className="flex space-x-3 items-center">
                  <h1 className="text-3xl font-bold">H1</h1>
                  <p>text-3xl font-bold</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h2 className="text-2xl font-bold">H2</h2>
                  <p>text-2xl font-bold</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h3 className="text-xl font-bold">H3</h3>
                  <p>text-xl font-bold</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h4 className="text-base font-bold">H4</h4>
                  <p>text-base font-bold</p>
                </div>
              </div>

              <div className="bg-gray-200 grid justify-items-left p-5 mx-10 rounded-lg space-y-2">
                <h3 className="text-xl font-semibold">Text</h3>
                <div className="flex space-x-3 items-center">
                  <h1 className="text-2xl">Subtitle 1</h1>
                  <p>text-2xl</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h2 className="text-base font-semibold">Body 1</h2>
                  <p>text-base font-semibold</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h3 className="text-base">Body 2</h3>
                  <p>text-base</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h4 className="text-sm">Body 3</h4>
                  <p>text-sm</p>
                </div>
              </div>

              <div className="bg-gray-200 grid justify-items-left p-5 mx-10 rounded-lg space-y-2">
                <h3 className="text-xl font-semibold">Buttons</h3>
                <div className="flex space-x-3 items-center">
                  <h1 className="text-base font-semibold">Large</h1>
                  <p>text-base font-semibold</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h2 className="text-base">Medium</h2>
                  <p>text-base</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <h4 className="text-sm">Small</h4>
                  <p>text-sm</p>
                </div>
              </div>

            </div>
          </div>
        </section>
        
        <section className="mt-5 body-font font-montserrat">
          <h2 className="text-2xl font-bold">Buttons</h2>
          <div className="container max-w-7xl mx-auto px-6 py-5 md:px-0">
            <div className="flex">
              <div className="grid justify-items-center mx-10">
                <h3 className="text-xl">Primary Buttons</h3>
                <Buttons text="Large" type="primary" size="large"></Buttons>
                <Buttons text="Medium" type="primary" size="medium"></Buttons>
              </div>
              <div className="grid justify-items-center mx-10">
                <h3 className="text-xl">Secondary Buttons</h3>
                <Buttons text="Large" type="secondary" size="large"></Buttons>
                <Buttons text="Medium" type="secondary" size="medium"></Buttons>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 body-font font-montserrat">
          <h2 className="text-2xl font-bold">Links</h2>
        </section>

        <section className="mt-5 body-font font-montserrat">
          <h2 className="text-2xl font-bold">Cards</h2>
          <h3 className="text-xl mt-2">Company Card</h3>
          <div className="grid min-w-full grid-cols-1 grid-flow-row sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3 gap-3">
            <Card title="Job Title 1" postedBy="by Goodhive" postedOn="posted 4 days ago" image="/img/company_img.png" countryFlag="/img/country_flag.png" city="" rate="" description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor." skills={['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4']} buttonText="Apply" />
            <Card title="Job Title 2" postedBy="by Goodhive" postedOn="posted 3 days ago" image="/img/company_img.png" countryFlag="/img/country_flag.png" city="" rate="" description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor." skills={['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4']} buttonText="Apply" />
            <Card title="Job Title 3" postedBy="by Goodhive" postedOn="posted 2 days ago" image="/img/company_img.png" countryFlag="/img/country_flag.png" city="" rate="" description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor." skills={['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4']} buttonText="Apply" />
          </div>
          <h3 className="mt-5 text-xl">Talent Card</h3>
          <div className="grid min-w-full grid-cols-1 grid-flow-row sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 4xl:grid-cols-3 gap-3">
            <Card title="Talent 1 Position" postedBy="Talent Name" postedOn="Active 4 days ago" image="/img/talent_avatar.png" countryFlag="/img/country_flag.png" city="Paris" rate="$75 USD/hour" description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod." skills={['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4']} buttonText="Connect" />
            <Card title="Talent 2 Position" postedBy="Talent Name" postedOn="Active 3 days ago" image="/img/talent_avatar.png" countryFlag="/img/country_flag.png" city="Hyderabad" rate="$50 USD/hour" description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod." skills={['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4']} buttonText="Connect" />
            <Card title="Talent 3 Position" postedBy="Talent Name" postedOn="Active 2 days ago" image="/img/talent_avatar.png" countryFlag="/img/country_flag.png" city="San Francisco" rate="$120 USD/hour" description="Talent profile description will come here when posted Amet, consecq consec consectetur adipiscing elit, sed do eiusmod." skills={['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4']} buttonText="Connect" />
          </div>
        </section>
        
        <section className="mt-5 body-font font-montserrat">
          <h2 className="text-2xl font-bold">Metamask</h2>
        </section>
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
