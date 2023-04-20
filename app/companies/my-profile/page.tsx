"use client";

import { useRef, useState, FormEvent } from "react";

import DragAndDropFile from "../../components/drag-and-drop-file";
import { Button } from "../../components/button";

interface FileData {
  name: string;
  type: string;
  data: string | ArrayBuffer | null;
}

export default function MyProfile() {
  const invoiceInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<false | FileData>(false);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const dataForm = {
      jobHeadline: formData.get("job-headline"),
      companiesName: formData.get("companies-name"),
      companiesAddress: formData.get("companies-address"),
      country: formData.get("country"),
      city: formData.get("city"),
      phoneCountryCode: formData.get("phone-country-code"),
      phoneNumber: formData.get("phone-number"),
      email: formData.get("email"),
      telegram: formData.get("telegram"),
      aboutWork: formData.get("about-work"),
    };

    // TODO: POST formData to the server with fetch
    const res = await fetch("/api/companies/my-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    const data = await res.json();

    setIsLoading(false);
    if (!res.ok) {
      throw new Error(data.message || "Something went wrong!");
    } else {
      alert("Profile Saved!");
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
                htmlFor="job-headline"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Describe your company in a few words?
              </label>
            </div>
            <div>
              <textarea
                name="job-headline"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Describe your company in a few words?"
                required
                rows={5}
              />
            </div>

            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="companies-name"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Company Name
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Companies Name"
                  name="companies-name"
                  type="text"
                  required
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="companies-address"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Company Address
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Companies Address"
                  name="companies-address"
                  type="text"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="country"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Country
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Country"
                  type="text"
                  name="country"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="city"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  City
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="City"
                  type="text"
                  name="city"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="phone-country-code"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Country Code
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Phone Country Code"
                  type="text"
                  name="phone-country-code"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="phone-number"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Number
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Phone Number"
                  type="number"
                  required
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
                  Email
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Email"
                  type="email"
                  required
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
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Telegram"
                  type="text"
                  name="telegram"
                />
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="about-work"
                className="inline-block ml-3 text-base text-black form-label"
              >
                What are you looking for?
              </label>
              <textarea
                name="about-work"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="What you are looking for?"
                required
                rows={5}
              />
            </div>
            {isLoading && (
              <div>
                <svg
                  className="animate-spin h-5 w-5 mr-3 ..."
                  viewBox="0 0 24 24"
                ></svg>
              </div>
            )}
            <div className="mt-10 text-right">
              {isLoading ? (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                  type="submit"
                  disabled
                >
                  Saving...
                </button>
              ) : (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                >
                  Save and Continue
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
