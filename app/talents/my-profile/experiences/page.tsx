"use client";

import { useRef, useState, FormEvent } from "react";

import Autosuggest from "react-autosuggest";
import toast from "react-hot-toast";

// TODO: use button but before add the type of the button component (i.e. type="button" or type="submit")
//import { Button } from "../../../components/button";
import { SelectInput } from "../../../components/select-input";
import { skills } from "../../../constants/skills";

interface Option {
  value: string;
  label: string;
}
export default function CreateJob() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const startMonth = Number(formData.get("start-month"));
    const startYear = Number(formData.get("start-year"));
    const contractStart = new Date(startYear, startMonth);

    const endMonth = Number(formData.get("end-month"));
    const endYear = Number(formData.get("end-year"));
    const contractEnd = new Date(endYear, endMonth);

    const dataForm = {
      title: formData.get("title"),
      typeEmployment: formData.get("type-employment"),
      designation: formData.get("designation"),
      address: formData.get("address"),
      contractStart,
      contractEnd,
      description: formData.get("description"),
      skills: selectedSkills,
    };

    const experienceResponse = await fetch("/api/talents/experiences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    setIsLoading(false);

    if (!experienceResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Profile Saved!");
    }
  };

  //TODO: Put the following code in a Autosuggest Input component

  const employment: Option[] = [
    { value: "fulltime", label: "Full-time" },
    { value: "parttime", label: "Part-time" },
    { value: "internship", label: "Internship" },
    { value: "remote", label: "Remote" },
    { value: "other", label: "Other" },
  ];
  // Get the current date
  const currentDate = new Date();

  // Create an array of month options with full names
  const month: Option[] = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(currentDate.getFullYear(), index);
    const monthName = date.toLocaleString("en-US", { month: "long" });
    return { value: monthName.toLowerCase(), label: monthName };
  });

  const startYear = 1995;
  const endYear = 2023;

  const year: Option[] = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => ({
      value: (startYear + index).toString(),
      label: (startYear + index).toString(),
    })
  );

  const AutoSuggestInput = () => {
    const [inputValue, setInputValue] = useState("");

    const getSuggestions = (value: string) => {
      const inputValue = value.trim().toLowerCase();
      const inputLength = inputValue.length;

      return inputLength === 0
        ? []
        : skills.filter(
            (skill) => skill.toLowerCase().slice(0, inputLength) === inputValue
          );
    };

    const onSuggestionSelected = (
      event: React.FormEvent<HTMLInputElement>,
      { suggestion }: Autosuggest.SuggestionSelectedEventData<any>
    ) => {
      if (!selectedSkills.includes(suggestion)) {
        setSelectedSkills([...selectedSkills, suggestion]);
      }
    };
    const renderSuggestion = (suggestion: string) => (
      <div className="mx-1 px-2 py-2 z-10 hover:text-[#FF8C05] bg-white shadow-md max-h-48 overflow-y-auto border-gray-400 border-b-[0.5px] border-solid">
        {suggestion}
      </div>
    );

    const inputProps = {
      placeholder: "JavaScript, NextJS,...",
      type: "text",
      maxLength: 255,
      name: "skills",
      value: inputValue,
      onChange: (
        event: React.FormEvent<HTMLElement>,
        { newValue }: { newValue: string }
      ) => {
        setInputValue(newValue);
      },
      className:
        "relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-clip-padding transition ease-in-out focus:text-black bg-gray-100 focus:outline-none focus:ring-0",
    };

    return (
      <Autosuggest
        suggestions={getSuggestions(inputValue)}
        onSuggestionsFetchRequested={() => "ewffew"}
        onSuggestionsClearRequested={() => "wef"}
        getSuggestionValue={(skill) => skill}
        onSuggestionSelected={onSuggestionSelected}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  };
  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300">
        Professional Experience
      </h1>
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-full mt-4">
            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="title"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Title*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905]  hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Try Developer Solidity, Rust, C++..."
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <SelectInput
                  labelText="Select type of employment"
                  placeholder="Full-time, Part-time..."
                  name="type-employment"
                  required
                  options={employment}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-6 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="designation"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Company Name*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600  rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Name of the Company"
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
                  Location*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="text"
                  name="address"
                  placeholder="Paris, London, Remote..."
                  required
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-6 sm:flex-row">
              <div className="flex-1">
                <div className="flex gap-2">
                  <SelectInput
                    labelText="Start Date*"
                    placeholder="month"
                    name="start-month"
                    required
                    options={month}
                  />
                  <SelectInput
                    placeholder="year"
                    name="start-year"
                    required
                    options={year}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex gap-2">
                  <SelectInput
                    labelText="End Date*"
                    placeholder="month"
                    name="end-month"
                    required
                    options={month}
                  />
                  <SelectInput
                    placeholder="year"
                    name="end-year"
                    required
                    options={year}
                  />
                </div>
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
                  htmlFor="skills"
                  className="inline-block font-bold ml-3 text-base text-black form-label"
                >
                  Skills
                </label>
                <div className="absolute pr-10 pt-1 form-control w-full text-base font-normal text-gray-600 bg-white ">
                  <AutoSuggestInput />
                </div>
                <div className="pt-10">
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap mt-4 ">
                      {selectedSkills.map((skill, index) => (
                        <div
                          key={index}
                          className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                        >
                          <span className="mr-2">{skill}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSkills(
                                selectedSkills.filter((_, i) => i !== index)
                              )
                            }
                            className="w-6 text-black bg-gray-400 rounded-full"
                          >
                            &#10005;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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