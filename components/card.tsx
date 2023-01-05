import { FC } from "react";

import { Buttons } from "../components/buttons"

interface Props {
  title: string
  postedBy: string
  postedOn: string
  image: string
  countryFlag: string
  city: string
  rate: string
  description: string
  skills: string[]
  buttonText: string
}

export const Card: FC<Props> = ({title, postedBy, postedOn, image, countryFlag, city, rate, description, skills, buttonText}) => {
    
  return (
    <div className="grid justify-center w-[26rem] md:w-[18rem] sm:w-[26rem] min-w-full">
        <div className="flex">
        <div className="block p-6 rounded-xl shadow-xl bg-white">
            <div className="md:flex md:flex-row">
            <div className="md:w-20 w-20 flex justify-left items-center mb-6 lg:mb-0 mx-auto md:mx-0">
                <img className="h-20" src={image} alt="avatar"/>
            </div>
            <div className="md:ml-2">
                <p className="font-semibold text-xl mb-1 text-gray-800">{title}</p>
                <p className="text-base text-gray-600 mb-1">{postedBy}</p>
                <p className="text-base text-gray-600 mb-5">{postedOn}</p>
            </div>
            <div className="md:ml-5">
                <img className="mt-1 h-5 w-8 mb-4" src={countryFlag} alt="country"/>
                <p className="text-xs text-gray-600 mb-2">{city}</p>
                <p className="text-sm font-bold mb-1">{rate}</p>
            </div>
            </div>
            <p className="text-gray-500 font-light mb-6">{description}</p>
            <div className="flex justify-center">
                <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">{skills[0]}</span>
                <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">{skills[1]}</span>
                <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">{skills[2]}</span>
                <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">{skills[3]}</span>
            </div>
            <div className="flex justify-end">
                <Buttons text={buttonText} type="primary" size="medium"></Buttons>
            </div>
        </div>
        </div>
    </div>
  );

};