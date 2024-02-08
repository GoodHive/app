"use client";

import { useRef, useState, FormEvent, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

import DragAndDropFile from "../../components/drag-and-drop-file";
import { AddressContext } from "../../components/context";
import { SelectInput } from "../../components/select-input";
import { countries } from "../../constants/countries";
import LabelOption from "@interfaces/label-option";
import { Button } from "@/app/components/button";
import Link from "next/link";
import Image from "next/image";
import { SocialLink } from "@/app/talents/my-profile/social-link";
import { socialLinks } from "@/app/talents/my-profile/constant";
import { uploadFileToBucket } from "@utils/upload-file-bucket";
import { ReferralSection } from "@/app/components/referral/referral-section";

export default function MyProfile() {
  const imageInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    headline: "",
    designation: "",
    address: "",
    country: "",
    city: "",
    phone_country_code: "",
    phone_number: "",
    email: "",
    telegram: "",
    image_url: "",
    linkedin: "",
    github: "",
    stackoverflow: "",
    portfolio: "",
    status: "",
    referrer: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [isShowReferralSection, setIsShowReferralSection] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null
  );

  const walletAddress = useContext(AddressContext);

  const handleImageClick = () => {
    setProfileData({ ...profileData, image_url: "" });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);

      const profileResponse = await fetch(
        `/api/companies/my-profile?walletAddress=${walletAddress}`
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfileData(profileData);
        setIsShowReferralSection(true);
      } else {
        console.error(profileResponse.statusText);
      }
      setIsLoading(false);
    };

    if (walletAddress) fetchProfile();
  }, [walletAddress]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const isNewUser = !profileData.designation;
    const referralCode = Cookies.get("referralCode");
    const formData = new FormData(e.currentTarget);
    const imageUrl = await uploadFileToBucket(profileImage);

    const isAlreadyReferred = profileData.referrer ? true : false;

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
      imageUrl,
      walletAddress,
      linkedin: formData.get("linkedin"),
      github: formData.get("github"),
      stackoverflow: formData.get("stackoverflow"),
      portfolio: formData.get("portfolio"),
      status: profileData.status || "pending",
      referralCode: isAlreadyReferred ? null : referralCode,
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
      if (isNewUser) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: dataForm.email,
            type: "new-company",
            subject: `Welcome to GoodHive, ${dataForm.designation}! 🌟 Let's Connect You with Top IT Talent`,
          }),
        });
      }
      if (profileData.status === "approved") {
        toast.success("Profile Saved!");
      } else {
        toast.success("Profile saved but still under review by the core team!");
      }
    }
  };

  if (!walletAddress) {
    return (
      <h2 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 To get started, please connect your wallet. This will enable you to
        create or save your profile. Thanks!
      </h2>
    );
  }

  return (
    <main className="container mx-auto">
      {profileData && profileData.status === "pending" && (
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 Your profile is pending approval. It will be live soon.
        </p>
      )}
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 pb-2">
        My Profile
      </h1>
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center w-full mt-10">
            {profileData.image_url ? (
              <div
                className="relative h-[230px] w-[230px] flex items-center mt-10 justify-center cursor-pointer bg-gray-100"
                style={{
                  clipPath:
                    "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                }}
                onClick={handleImageClick}
              >
                <Image
                  className="object-cover"
                  src={profileData.image_url}
                  alt="profile-picture"
                  fill
                />
              </div>
            ) : (
              <DragAndDropFile
                file={profileImage}
                setFile={setProfileImage}
                isRenderedPage={isRenderedPage}
                setIsRenderedPage={setIsRenderedPage}
                imageInputValue={imageInputValue}
              />
            )}
          </div>
          <div className="w-full flex justify-center mt-2">
            <Link href={`/companies/${walletAddress}`}>
              <Button text="Public View" type="secondary" size="medium" />
            </Link>
          </div>
          <div className="w-full flex justify-center mt-7">
            <Link href={`/companies/create-job`}>
              <Button text="Create Job" type="secondary" size="medium" />
            </Link>
          </div>
          <div className="flex flex-col w-full mt-20">
            <div className="flex-1 mb-5">
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
                defaultValue={profileData.designation}
              />
            </div>

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
                defaultValue={profileData.headline}
              />
            </div>

            <div className="flex flex-col gap-4 mt-10">
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
                  defaultValue={profileData.email}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-4 sm:flex-col">
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
                  maxLength={100}
                  defaultValue={profileData.address}
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
                  pattern="[a-zA-Z \-]+"
                  maxLength={100}
                  defaultValue={profileData.city}
                />
              </div>
              <div className="flex-1">
                <SelectInput
                  labelText="Country"
                  name="country"
                  required={true}
                  disabled={false}
                  inputValue={selectedCountry}
                  setInputValue={setSelectedCountry}
                  options={countries}
                  defaultValue={
                    countries[
                      countries.findIndex(
                        (country) => country.value === profileData?.country
                      )
                    ]
                  }
                />
              </div>
            </div>
            <div className="flex gap-4 mt-4 sm:flex-col">
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
                    defaultValue={profileData.phone_country_code}
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
                  defaultValue={profileData.phone_number}
                />
              </div>
            </div>

            {/* Social media links: Linkedin, github, stackoverflow, telegram, portfolio */}
            <div className="flex w-full flex-col my-7">
              <h3 className="inline-block mt-7 mb-2 ml-1 text-base font-medium text-black form-label">
                Social Media Links:
              </h3>
              {socialLinks.map((socialLink) => (
                <SocialLink
                  key={socialLink.name}
                  name={socialLink.name}
                  icon={socialLink.icon}
                  placeholder={socialLink.placeholder}
                  value={
                    profileData[
                      socialLink.name as keyof typeof profileData
                    ] as string
                  }
                  isRequired={socialLink.isRequired}
                />
              ))}
            </div>

            {isShowReferralSection && <ReferralSection />}

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
