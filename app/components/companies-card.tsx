import Image from "next/image";

import { FC } from "react";

import { Button } from "./button";

interface Props {
  designation: string;
  image: string;
  website: string;
  details: string;
  mail: string;
  phoneNumber: string;
  country: string;
  city: string;
  address: string;
  countryFlag: string;
  telegram: string;
  buttonText: string;
}

export const CompaniesCard: FC<Props> = ({
  designation,
  image,
  website,
  details,
  mail,
  phoneNumber,
  country,
  city,
  address,
  countryFlag,
}) => {
  return (
    <div className="mt-11 ">
      <div className="block bg-blend-darken shadow-gray-300 rounded-3xl shadow-xl box-border border-r-2 border-l-2  border-radius  bg-white">
        <div className="flex pl-4 pr-5 pt-5 justify-end">
          {" "}
          <Image
            className="mt-1 h-5 mb-4 flex w-8"
            src={countryFlag}
            alt="country"
            width={15}
            height={9}
          />
        </div>
        <div className="w-20 mx-auto flex justify-center">
          <Image src={image} alt="avatar" width={157} height={166} />
        </div>
        <div className=" pt-7 flex flex-col items-center ">
          <p className="flex text-center font-semibold text-xl text-gray-800 ">
            {designation}
          </p>
          <p className="flex text-center text-base text-gray-600 ">{website}</p>
          <div className="space-x-3 flex w-32 ">
            <Button text="Contact" type="secondary" size="small" />
          </div>
        </div>
        <div className="pl-8 pr-8 pt-5">
          <p className="font-bold text-base whitespace-nowrap flex flex-auto">
            {" "}
            Profile
          </p>
          <span className=" text-justify flex text-gray-500 font-light">
            {details}
          </span>
        </div>
        <div className="flex pt-5 pl-8 pb-3">
          <p className="font-bold text-base whitespace-nowrap flex pr-5">
            {" "}
            Social Media :
          </p>
          <div className="flex items-center space-x-2 pb-5">
            <a className="target " href="">
              <svg
                width="29"
                height="30"
                viewBox="0 0 29 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.4737 0.1875C6.48421 0.1875 0 6.67171 0 14.6612C0 22.6507 6.48421 29.1349 14.4737 29.1349C22.4632 29.1349 28.9474 22.6507 28.9474 14.6612C28.9474 6.67171 22.4632 0.1875 14.4737 0.1875ZM9.72632 9.79803V23.027H6.10789V9.79803H9.72632ZM10.0158 6.15066C10.0158 7.3375 9.06053 8.29276 7.90263 8.29276C6.74474 8.29276 5.81842 7.3375 5.81842 6.15066C5.81842 4.99276 6.74474 4.0375 7.90263 4.0375C9.06053 4.0375 10.0158 4.99276 10.0158 6.15066ZM24.1421 14.8928V23.027H20.5237V16.2822C20.5237 12.2296 15.7184 12.548 15.7184 16.2822V23.027H12.1289V9.79803H15.7184V11.9401C17.3974 8.81382 24.1421 8.58224 24.1421 14.8928Z"
                  fill="black"
                  fillOpacity="0.6"
                />
              </svg>
            </a>
            <a className="target " href="">
              <svg
                width="30"
                height="29"
                viewBox="0 0 30 29"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.2623 0.710938C23.2517 0.710938 29.7359 7.19515 29.7359 15.1846C29.7359 21.553 25.5965 26.9952 19.8649 28.9057C19.1412 29.0504 18.8807 28.5873 18.8807 28.2109C18.8807 27.7188 18.9096 26.1557 18.9096 24.2452C18.9096 22.8846 18.4465 22.0162 17.9254 21.553C21.1386 21.2057 24.5254 19.9609 24.5254 14.403C24.5254 12.8109 23.9754 11.5373 23.0491 10.5241C23.1938 10.1767 23.6859 8.67147 22.9044 6.70304C22.9044 6.70304 21.6886 6.29778 18.9096 8.17936C17.7517 7.86094 16.5359 7.68725 15.2912 7.68725C14.0754 7.68725 12.8307 7.86094 11.6728 8.17936C8.92278 6.32673 7.707 6.70304 7.707 6.70304C6.89647 8.67147 7.41752 10.1767 7.56226 10.5241C6.63594 11.5373 6.08594 12.8399 6.08594 14.403C6.08594 19.9609 9.44384 21.2057 12.657 21.553C12.2517 21.9294 11.8754 22.5662 11.7307 23.4925C10.8912 23.8688 8.83594 24.4767 7.53331 22.3057C7.24384 21.8715 6.43331 20.8004 5.30436 20.8294C4.08857 20.8294 4.81226 21.4952 5.30436 21.7846C5.94121 22.132 6.63594 23.4057 6.80963 23.8109C7.0991 24.6215 8.02542 26.1846 11.6728 25.5188C11.6728 26.7346 11.6728 27.8636 11.6728 28.2109C11.6728 28.5873 11.4123 29.0215 10.6886 28.9057C4.92805 26.9952 0.788574 21.582 0.788574 15.1846C0.788574 7.19515 7.27279 0.710938 15.2623 0.710938Z"
                  fill="black"
                  fillOpacity="0.6"
                  className="logo"
                />
              </svg>
              <style jsx>{`
                .logo:hover {
                  fill: gray;
                }
              `}</style>
            </a>
            <a className="target" href="">
              <svg
                width="31"
                height="31"
                viewBox="0 0 31 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.2676 0.660156C6.98758 0.660156 0.267578 7.38016 0.267578 15.6602C0.267578 23.9402 6.98758 30.6602 15.2676 30.6602C23.5476 30.6602 30.2676 23.9402 30.2676 15.6602C30.2676 7.38016 23.5476 0.660156 15.2676 0.660156ZM9.02758 9.42016H15.2076L15.7476 8.73016L17.4876 6.00016L17.6976 5.61016H21.5076V9.06016L17.6976 16.3502L18.0276 16.7102H21.5076V21.5402H15.2676L14.9076 22.0502L13.0476 25.3202L12.8376 25.7102H9.02758V22.0502L12.8376 15.0002L12.5076 14.6102H9.02758V9.42016Z"
                  fill="black"
                  fillOpacity="0.6"
                  className="logo"
                />
              </svg>
              <style jsx>{`
                .logo:hover {
                  fill: green;
                }
              `}</style>
            </a>
          </div>
        </div>
      </div>
      <div className="block mt-5 bg-blend-darken shadow-gray-300 rounded-3xl shadow-xl box-border border-r-2 border-l-2  border-radius  bg-white">
        <div className="pt-5 pb-3 pr-1 pl-4">
          <p className="font-bold text-base pr-1 whitespace-nowrap inline">
            {" "}
            Contact Info
          </p>
        </div>
        <div className=" pl-5 pr-5 pb-5">
          <div className=" text-gray-500 font-light pt-3">
            <p className="font-bold text-base pr-1 whitespace-nowrap inline">
              {" "}
              Email
            </p>
            <span className="inline text-gray-500 font-light">{mail}</span>
          </div>
          <div className=" text-gray-500 font-light">
            <p className="font-bold text-base pr-1 whitespace-nowrap inline">
              {" "}
              Phone
            </p>
            <span className="inline text-gray-500 font-light">
              {phoneNumber}
            </span>
          </div>
          <div className="text-gray-500 font-light flex flex-wrap items-baseline">
            <p className="font-bold text-base pr-1">Address</p>
            <div className="text-gray-500 font-light">
              <div>{address}</div>
              <div>{city}</div>
              <div>{country}</div>
            </div>
          </div>

          <div className=" text-gray-500 font-bold flex flex-row pt-5">
            {" "}
            Telegram
            <a className="target pl-3" href="https://web.telegram.org/z/">
              <svg
                width="31"
                height="31"
                viewBox="0 0 31 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.5947 0.660156C23.8747 0.660156 30.5947 7.38016 30.5947 15.6602C30.5947 23.9402 23.8747 30.6602 15.5947 30.6602C7.31473 30.6602 0.594727 23.9402 0.594727 15.6602C0.594727 7.38016 7.31473 0.660156 15.5947 0.660156ZM25.0447 16.4102C23.2747 15.4202 21.3247 14.6102 19.4947 13.8002C16.3147 12.4802 13.1647 11.1602 9.95473 9.93016C9.32473 9.72016 8.21473 9.54016 8.09473 10.4402C8.15473 11.7602 8.39473 13.0502 8.57473 14.3702C8.99473 17.2202 9.50473 20.0702 9.98473 22.9202C10.1647 23.8802 11.3347 24.3602 12.1147 23.7602C13.9447 22.5302 15.7747 21.3002 17.5747 20.0402C18.1747 19.4402 17.6347 18.5702 17.0947 18.1502C15.5947 16.6502 14.0047 15.3902 12.5647 13.8302C12.1747 12.9002 13.3147 13.6802 13.7047 13.9202C15.7447 15.3602 17.7547 16.8602 19.9447 18.0902C21.0547 18.7202 22.3447 18.1802 23.4547 17.8502C24.4447 17.4302 25.9147 17.0402 25.0447 16.4102Z"
                  fill="black"
                  fillOpacity="0.6"
                  className="logo"
                />
              </svg>
              <style jsx>{`
                .logo:hover {
                  fill: #23a1dd;
                }
              `}</style>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
