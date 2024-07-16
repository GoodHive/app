import { Metadata } from "next";

import { Hero } from "@components/home/hero";
import { Services } from "@components/home/services";
import { HowItWorks } from "@components/home/how-it-works";
import { ReachUs } from "@components/home/reach-us";
import GoogleAnalytics from "@components/google-analytics";

export const metadata: Metadata = {
  title: "Home Page | GoodHive",
  keywords:
    "Recruitment, Web3 Talent, Crypto Jobs, Blockchain Jobs, Collaborative Recruitment",
  description:
    "Unlock opportunities in the Web3 space with our Collaborative Recruitment Platform. Find the best Web3 talent, crypto jobs, and blockchain jobs today. Your go-to hub for seamless recruitment.",
};

export default function Home() {
  return (
    <div className="home-page overflow-hidden">
      <GoogleAnalytics />
      <Hero />
      <Services />
      <HowItWorks />
      <ReachUs />
    </div>
  );
}
