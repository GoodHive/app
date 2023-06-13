import Image from "next/image";

import { FC } from "react";

interface Props {
  type: string;
  title: string;
  postedBy: string;
  details: string;
  duration: string;
  image: string;
  country: string;
  countryFlag: string;
  city: string;
  ratePerHour: string;
  typeEngagement: string;
  skills: string[];
  buttonText: string;
}

export const JobCard: FC<Props> = ({
  title,
  postedBy,
  details,
  duration,
  image,
  country,
  countryFlag,
  city,
  typeEngagement,
  skills,
}) => {
  return (
    <div className="mt-11 ">
      <div className="block p-6 bg-blend-darken shadow-gray-300 rounded-3xl shadow-xl box-border border-r-2 border-l-2  border-radius  bg-white">
        <div className="flex items-center justify-end">
          <a href="" className="inline-block mr-2">
            <img src="/img/bin.png" alt="bin" width="25" height="25" />
          </a>
          <a href="" className="inline-block">
            <img src="/img/edit.png" alt="edit" width="25" height="25" />
          </a>
        </div>
        <div className="pl-4 pr-5">
          <div className="flex flex-row ">
            <div className=" md:w-20 w-20 flex items-center mb-6 lg:mb-0 mx-auto md:mx-0   ">
              <Image src={image} alt="avatar" width={157} height={166} />
            </div>
            <div className="md:ml-2  pl-8 pt-7  ">
              <p className="font-semibold text-xl  text-gray-800 ">
                {postedBy}
              </p>
              <p className="text-base text-gray-600 ">
                {typeEngagement} - {duration}
              </p>
              <div className="flex flex-row">
                <p className="text-base text-gray-600 mb-5">
                  {city}, {country}
                </p>
                <div className="pl-3 ">
                  <Image
                    className="mt-1 h-3 w-5 mb-4 hover:"
                    src={countryFlag}
                    alt="country"
                    width={34}
                    height={23}
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap ">
                {" "}
                Job header
              </p>
              <p className=" flex text-justify text-gray-500 font-light">
                {title}
              </p>
            </div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap">
                {" "}
                Job description
              </p>
              <span className=" flex text-justify text-gray-500 font-light">
                {details}
              </span>
            </div>
            <div className="flex flex-col pt-4 ">
              <p className="font-bold text-base whitespace-nowrap">
                Mandatory Skill:
              </p>
              <div className="pt-3 grid grid-cols-3 grid-flow-row md:grid-cols-5 lg:grid-cols-7 gap-1">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-block bg-gray-100 border border-solid border-[#FFC905] rounded-full py-1 text-xs font-semibold text-center mr-1 mb-1"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
