"use client";

import Image from "next/image";
import type { FC } from "react";

import { FeatureCardProps } from "./feature-card.types";

export const FeatureCard: FC<FeatureCardProps> = (props) => {
  const { id, title, description, imageSrc, btnText, onClickHandler } = props;

  const onCtaClickHandler = () => {
    onClickHandler(id);
  };

  return (
    <div className="w-full flex max-w-[475px] sm:max-w-[300px]">
      <div className="shrink-0 relative w-24 h-24 mr-5 sm:w-14 sm:h-14">
        <Image alt="feature card polygon image" src={imageSrc} fill={true} />
      </div>
      <div className="shrink flex flex-col">
        <h3 className="text-black text-xl font-bold mb-4 sm:text-base">
          {title}
        </h3>
        <p className="text-black text-base font-normal mb-3 sm:text-sm">
          {description}
        </p>
        <button
          className="w-[230px] h-10 rounded-2xl bg-[#ffc905] border-none text-black text-base font-normal sm:w-32 sm:h-12 sm:text-xs"
          onClick={onCtaClickHandler}
        >
          {btnText}
        </button>
      </div>
    </div>
  );
};
