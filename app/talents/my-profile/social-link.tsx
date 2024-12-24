import { FC, useEffect } from "react";
import Image from "next/image";
import { FieldValues, UseFormSetValue } from "react-hook-form";

type SocialLinkProps = {
  name: string;
  icon: string;
  placeholder: string;
  defaultValue: string;
  isRequired?: boolean;
  setValue: UseFormSetValue<FieldValues>;
  errorMessage?: string;
};

export const SocialLink: FC<SocialLinkProps> = (props) => {
  const {
    name,
    icon,
    placeholder,
    defaultValue,
    isRequired = false,
    setValue,
    errorMessage,
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(name, event.target.value);
  };

  return (
    <div className="flex w-full mt-9">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden">
        <Image src={icon} alt="social-icon" fill />
      </div>
      <div className="w-full">
        <input
          className="form-control block w-full px-4 py-2 ml-3 text-base font-normal text-gray-600 bg-white bg-clip-padding border-b border-solid hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:outline-none"
          placeholder={placeholder}
          type="text"
          name={name}
          maxLength={255}
          defaultValue={defaultValue}
          required={isRequired}
          onChange={handleChange}
        />
        {errorMessage && (
          <span className="text-red-500 text-sm mt-1">{errorMessage}</span>
        )}
      </div>
    </div>
  );
};
