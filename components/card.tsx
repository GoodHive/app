import { FC } from 'react'

import { Button } from '../components/button'

interface Props {
  type: string
  title: string
  postedBy: string
  postedOn: string
  image: string
  countryFlag: string
  city: string
  rate: string
  currency: string
  description: string
  skills: string[]
  buttonText: string
  escrowFee: string
}

export const Card: FC<Props> = ({
  type,
  title,
  postedBy,
  postedOn,
  image,
  countryFlag,
  city,
  rate,
  currency,
  description,
  skills,
  buttonText,
  escrowFee,
}) => {
  let escrowIcon = '/img/escrow_icon.png'
  let ratePerHour = `$${rate} ${currency}/Hour`
  let escrowDescription = `$${escrowFee}`

  if (type === 'talent') {
    escrowIcon = '/img/white_space.png'
    escrowDescription = ''
  } else {
    ratePerHour = ''
  }

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
              <p className="text-sm font-bold mb-1">{ratePerHour}</p>
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
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center">
              <img className="h-5 w-8 mr-2" src={escrowIcon} alt="escrow" />
              <p className="text-sm font-bold">{escrowDescription}</p>
            </div>
            <Button text={buttonText} type="primary" size="medium"></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
