import { FC } from "react";

interface Props {
    text: string
    type: string
    size: string
}

export const Buttons: FC<Props> = ({ text, type, size }) => {
    let whichButton: string = type + size;
    
    switch(whichButton) {
        case 'primarylarge': {
            whichButton = 'my-2 bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out';
            break;
        }
        case 'primarymedium': {
            whichButton = 'my-2 bg-[#FFC905] h-12 w-44 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out';
            break;
        }
        case 'secondarylarge': {
            whichButton = 'my-2 outline bg-[#FFC905] bg-opacity-0 outline-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-20 active:shadow-md transition duration-150 ease-in-out';
            break;
        }
        case 'secondarymedium': {
            whichButton = 'my-2 outline  bg-[#FFC905] bg-opacity-0 outline-[#FFC905] h-12 w-44 rounded-full hover:bg-opacity-20 active:shadow-md transition duration-150 ease-in-out';
            break;
        }
        default: {
            whichButton = 'my-2 bg-[#FFC905] h-12 w-44 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out';
            break;
        }
    }

    return (
        <button className={whichButton}>{text}</button>
      );
    
};