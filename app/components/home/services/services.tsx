"use client";

import { useRouter } from "next/navigation";
import { FeatureCard } from "@/app/components/feature-card";
import { Button } from "@components/button";

import { GoodhiveQuestLink } from "@constants/common";
import { TRANSLATION, allServices } from "./services.constants";

export const Services = () => {
  const router = useRouter();

  const onCtaClickHandler = (id: string) => {
    if (id === "talent") {
      router.push("/talents/job-search");
    } else if (id === "companies") {
      router.push("/companies/search-talents");
    }
  };

  const onJoinQuestsClickHandler = () => {
    window.open(GoodhiveQuestLink, "_blank");
  };

  return (
    <div className="container mx-auto w-full pt-12">
      <h1 className="text-black text-center text-3xl font-bold mb-4 sm:text-2xl">
        {TRANSLATION.title}
      </h1>
      <div className="flex flex-col items-center mb-12">
        <p className="text-center mb-4">
          Unlock exclusive referrals rewards and gain governance power. Enjoy
          privileged access to Airdrops and Whitelists, and become an esteemed
          holder of our Scout and/or Pioneer NFTs.
        </p>
        <Button
          text="Join our Quests"
          type="primary"
          size="small"
          onClickHandler={onJoinQuestsClickHandler}
        />
      </div>
      <p className="text-black text-center text-lg font-normal mb-24 sm:text-base sm:mb-12">
        {TRANSLATION.description}
      </p>
      <div className="w-full flex flex-wrap justify-center gap-16 mb-24 sm:mb-12">
        {allServices.map((service) => {
          const { id, title, description, imageSrc, btnText } = service;
          return (
            <FeatureCard
              key={id}
              id={id}
              title={title}
              description={description}
              imageSrc={imageSrc}
              btnText={btnText}
              onClickHandler={onCtaClickHandler}
            />
          );
        })}
      </div>
    </div>
  );
};
