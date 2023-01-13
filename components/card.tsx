import { FC } from 'react'

import { Button } from '../components/button'

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

export const Card: FC<Props> = ({
  title,
  postedBy,
  postedOn,
  image,
  countryFlag,
  city,
  rate,
  description,
  skills,
  buttonText,
}) => {
  return (
    <div className="grid justify-center">
      <div className="flex">
        <div className="block p-6 rounded-xl shadow-xl bg-white">
          <div className="md:flex md:flex-row">
            <div className="md:w-20 w-20 flex justify-left items-center mb-6 lg:mb-0 mx-auto md:mx-0">
              <img className="h-20" src={image} alt="avatar" />
            </div>
            <div className="md:ml-2">
              <p className="font-semibold text-xl mb-1 text-gray-800">
                {title}
              </p>
              <p className="text-base text-gray-600 mb-1">{postedBy}</p>
              <p className="text-base text-gray-600 mb-5">{postedOn}</p>
            </div>
            <div className="md:ml-5">
              <img
                className="mt-1 h-5 w-8 mb-4"
                src={countryFlag}
                alt="country"
              />
              <p className="text-xs text-gray-600 mb-2">{city}</p>
              <p className="text-sm font-bold mb-1">{rate}</p>
            </div>
          </div>
          <p className="text-gray-500 font-light mb-6">{description}</p>
          <div className="grid min-w-full grid-cols-2 grid-flow-row sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-4 4xl:grid-cols-4 gap-3">
            <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold text-center mr-2 mb-2">
              {skills[0]}
            </span>
            <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold text-center mr-2 mb-2">
              {skills[1]}
            </span>
            <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold text-center mr-2 mb-2">
              {skills[2]}
            </span>
            <span className="inline-block bg-[#FFF2CE] rounded-full px-3 py-1 text-sm font-semibold text-center mr-2 mb-2">
              {skills[3]}
            </span>
          </div>
          <div className="flex justify-end">
            <Button
              text={buttonText}
              type="primary"
              size="medium"
              image="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416V96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4L224 214.3V256v41.7L52.5 440.6zM256 352V256 128 96c0-12.4 7.2-23.7 18.4-29s24.5-3.6 34.1 4.4l192 160c7.3 6.1 11.5 15.1 11.5 24.6s-4.2 18.5-11.5 24.6l-192 160c-9.5 7.9-22.8 9.7-34.1 4.4s-18.4-16.6-18.4-29V352z"
            ></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
