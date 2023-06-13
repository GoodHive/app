"use client";

import { useState, FormEvent } from "react";

import toast from "react-hot-toast";

import { SelectInput } from "../../../components/select-input";
import { degrees } from "../../../constants/degrees";
import LabelOption from "@interfaces/label-option";

export default function CreateJob() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedDegree, setSelectedDegree] = useState<LabelOption | null>(null);
  const [selectedStartMonth, setSelectedStartMonth] = useState<LabelOption | null>(
    null
  );
  const [selectedStartYear, setSelectedStartYear] = useState<LabelOption | null>(
    null
  );
  const [selectedEndMonth, setSelectedEndMonth] = useState<LabelOption | null>(null);
  const [selectedEndYear, setSelectedEndYear] = useState<LabelOption | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const startYear = Number(selectedStartYear?.value);
    const startMonth = Number(selectedStartMonth?.value);
    const startDate = new Date(startYear, startMonth);

    const endYear = Number(selectedEndYear?.value);
    const endMonth = Number(selectedEndMonth?.value);
    const endDate = new Date(endYear, endMonth);

    const dataForm = {
      school: formData.get("school"),
      degree: selectedDegree?.value,
      filed: formData.get("filed"),
      location: formData.get("location"),
      startDate,
      endDate,
      description: formData.get("description"),
      distinction: formData.get("distinction"),
    };

    const educationResponse = await fetch("/api/talents/education", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    setIsLoading(false);

    if (!educationResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Education saved!");
    }
  };

  const month: LabelOption[] = Array.from({ length: 12 }, (_, index) => {
    const monthName = new Date(0, index).toLocaleString("en-US", {
      month: "long",
    });
    return { value: String(index + 1), label: monthName };
  });

  const startYear = parseInt(process.env.NEXT_PUBLIC_START_YEAR || "0");
  const endYear = parseInt(process.env.NEXT_PUBLIC_END_YEAR || "0");

  const year: LabelOption[] = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => {
      const yearValue = String(startYear + index);
      return { value: yearValue, label: yearValue };
    }
  );

  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300">
        Add education
      </h1>
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-full mt-4">
            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="school"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  School*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905]  hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Ex: MIT"
                  name="school"
                  type="text"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <SelectInput
                  labelText="Degree*"
                  name="degree"
                  required={true}
                  disabled={false}
                  inputValue={selectedDegree}
                  setInputValue={setSelectedDegree}
                  options={degrees}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-6 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="filed"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Filed of Study*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600  rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Ex: Business Studies"
                  name="filed"
                  type="text"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="location"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Location*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="text"
                  name="location"
                  placeholder="Paris, London, Remote..."
                  required
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-6 sm:flex-row">
              <div className="flex-1 flex gap-2">
                <SelectInput
                  labelText="Start date*"
                  name="start-month"
                  required={true}
                  disabled={false}
                  inputValue={selectedStartMonth}
                  setInputValue={setSelectedStartMonth}
                  options={month}
                />
                <SelectInput
                  name="start-year"
                  required={true}
                  disabled={false}
                  inputValue={selectedStartYear}
                  setInputValue={setSelectedStartYear}
                  options={year}
                />
              </div>
              <div className="flex-1 flex gap-2">
                <SelectInput
                  labelText="End date*"
                  name="end-month"
                  required={true}
                  disabled={false}
                  inputValue={selectedEndMonth}
                  setInputValue={setSelectedEndMonth}
                  options={month}
                />
                <SelectInput
                  name="end-year"
                  required={true}
                  disabled={false}
                  inputValue={selectedEndYear}
                  setInputValue={setSelectedEndYear}
                  options={year}
                />
              </div>
            </div>
            <div className="mb-10">
              <label
                htmlFor="description"
                className="inline-block ml-3 text-base text-black form-label mt-6"
              ></label>
              <div>
                <textarea
                  name="description"
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600  bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Description of the past assignement / projects"
                  maxLength={255}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="distinction"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Distinction*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600  rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Ex: Honors and Awards"
                  name="distinction"
                  type="text"
                  maxLength={100}
                />
              </div>
            </div>
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
