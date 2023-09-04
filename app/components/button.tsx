import { FC } from "react";

interface Props {
  text: string;
  type: string;
  size: string;
  onClick?: () => void; // Add onClick prop
}

export const Button: FC<Props> = ({ text, type, size, onClick }) => {
  let styleType = `${type}${size}`;

  switch (styleType) {
    case "primarylarge": {
      styleType =
        "my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "primarymedium": {
      styleType =
        "my-2 text-base bg-[#FFC905] h-12 w-44 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "secondarylarge": {
      styleType =
        "my-2 text-base font-semibold border-2 border-[#FFC905] bg-[#FFC905] bg-opacity-0 h-14 w-56 rounded-full hover:bg-opacity-20 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    case "secondarymedium": {
      styleType =
        "my-2 text-base border-2 border-[#FFC905] bg-[#FFC905] bg-opacity-0 h-12 w-44 rounded-full hover:bg-opacity-20 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
    default: {
      styleType =
        "my-2 text-base bg-[#FFC905] h-12 w-44 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out";
      break;
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <button className={styleType} onClick={handleClick}>
      {text}
    </button>
  );
};
