"use client";

import { useRef, useState, FormEvent, useEffect } from "react";

import toast from "react-hot-toast";

import DragAndDropFile from "../../components/drag-and-drop-file";

import { SelectInput } from "../../components/select-input";
import { countries } from "../../constants/countries";
import LabelOption from "@interfaces/label-option";
import FileData from "@interfaces/file-data";

export default function MyProfile() {
  const invoiceInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [file, setFile] = useState<false | FileData>(false);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);

  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(null);

  useEffect(() => {
    if (typeof file === "object" && file !== null) {
      const fetchImage = async () => {
        setIsLoading(true);
        const postImageResponse = await fetch("/api/picture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(file),
        });

        if (postImageResponse.ok) {
          const { imageUrl } = await postImageResponse.json();
          setImageUrl(imageUrl);
        } else {
          console.error(postImageResponse.statusText);
        }
        setIsLoading(false);
      };

      fetchImage();
    }
  }, [file]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const dataForm = {
      headline: formData.get("headline"),
      designation: formData.get("designation"),
      address: formData.get("address"),
      country: selectedCountry?.value,
      city: formData.get("city"),
      phoneCountryCode: formData.get("phone-country-code"),
      phoneNumber: formData.get("phone-number"),
      email: formData.get("email"),
      telegram: formData.get("telegram"),
      details: formData.get("details"),
      imageUrl,
    };

    // TODO: POST formData to the server with fetch
    const profileResponse = await fetch("/api/companies/my-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    setIsLoading(false);

    if (!profileResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Profile Saved!");
    }
  };
  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 pb-2">
        My Profile
      </h1>
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center w-full mt-10">
            <DragAndDropFile
              file={file}
              setFile={setFile}
              isRenderedPage={isRenderedPage}
              setIsRenderedPage={setIsRenderedPage}
              invoiceInputValue={invoiceInputValue}
            />
          </div>
          <div className="flex flex-col w-full mt-20">
            <div>
              <label
                htmlFor="headline"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Describe your company in a few words?*
              </label>
            </div>
            <div>
              <textarea
                name="headline"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Describe your company in a few words?"
                required
                maxLength={255}
                rows={5}
              />
            </div>

            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="designation"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Company Name*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Company Name"
                  name="designation"
                  type="text"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="address"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Address*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Address"
                  name="address"
                  type="text"
                  required
                  pattern="[a-zA-Z0-9 ]+"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <SelectInput
                  labelText="Country*"
                  name="country"
                  required={true}
                  disabled={false}
                  inputValue={selectedCountry}
                  setInputValue={setSelectedCountry}
                  options={countries}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="city"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  City*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="City"
                  type="text"
                  name="city"
                  required
                  pattern="[a-zA-Z -]+"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="phone-country-code"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Country Code*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">+</span>
                  </div>
                  <input
                    className="form-control block w-full px-10 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none pl-6"
                    placeholder="Phone Country Code"
                    type="text"
                    pattern="[0-9]+"
                    name="phone-country-code"
                    required
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="phone-number"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Number*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Phone Number"
                  type="text"
                  pattern="[0-9]+"
                  required
                  maxLength={20}
                  name="phone-number"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="email"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Email*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Email"
                  type="email"
                  required
                  maxLength={255}
                  name="email"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="telegram"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Telegram
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Telegram"
                  type="text"
                  maxLength={255}
                  name="telegram"
                />
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="details"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Company profile and services...*
              </label>
              <textarea
                name="details"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Company profile and services..."
                required
                maxLength={300}
                rows={5}
              />
            </div>
            <div className="mt-10 text-right">
              {isLoading ? (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                  type="submit"
                  disabled
                >
                  Loading...
                </button>
              ) : (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
