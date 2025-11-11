import { Metadata } from "next";
import { Hero } from "@components/home/hero";
import { HowItWorks } from "@components/home/how-it-works";
import { ReachUs } from "@components/home/reach-us";
import { Services } from "@components/home/services";

export const metadata: Metadata = {
  title:
    "GoodHive: Decentralized Web3 Recruitment Platform Empowering Tech Talent Collaboration",
  keywords:
    "Recruitment, Web3 Talent, Crypto Jobs, Blockchain Jobs, Collaborative Recruitment",
  description:
    "Unlock opportunities in the Web3 space with our Collaborative Recruitment Platform. Find the best Web3 talent, crypto jobs, and blockchain jobs today. Your go-to hub for seamless recruitment.",
};

export default function Home() {
  return (
    // Page Starts From Here
    <div className="home-page overflow-hidden">
      <Hero />
      <Services />
      <HowItWorks />
      <ReachUs />
    </div>
  );
}
