"use client";

import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";

import ProfileImageUpload from "@/app/components/profile-image-upload";
import { ReferralSection } from "@/app/components/referral/referral-section";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { countryCodes } from "@/app/constants/phoneNumberCountryCode";
import "@/app/styles/rich-text.css";
import { socialLinks } from "@/app/talents/my-profile/constant";
import { SocialLink } from "@/app/talents/my-profile/social-link";
import LabelOption from "@interfaces/label-option";
import { uploadFileToBucket } from "@utils/upload-file-bucket";
import dynamic from "next/dynamic";
import Link from "next/link";
import "react-quill/dist/quill.snow.css";
import { SelectInput } from "../../components/select-input";
import { countries } from "../../constants/countries";
// Dynamically import React Quill to prevent server-side rendering issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Define Quill modules and formats
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export default function MyProfile() {
  const userId = Cookies.get("user_id");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const imageInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    twitter: "",
    stackoverflow: "",
    portfolio: "",
    status: "",
    referrer: "",
    approved: false,
    inreview: null,
  });

  console.log(profileData, "Profile Data...");
  const unapprovedProfile =
    profileData?.approved === false && profileData.inreview === true;

  const savedProfile =
    profileData?.approved === false && profileData.inreview === false;

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [noProfileFound, setNoProfileFound] = useState<boolean>(false);
  const [isShowReferralSection, setIsShowReferralSection] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null,
  );

  const [selectedPhoneCountryCode, setSelectedPhoneCountryCode] =
    useState<LabelOption | null>(null);

  const { address } = useAccount();
  const walletAddress = address || "";

  // Convert countryCodes to LabelOption format for SelectInput
  const phoneCountryCodeOptions: LabelOption[] = countryCodes.map(
    (countryCode) => ({
      label: `${countryCode.name} ${countryCode.dial_code}`,
      value: countryCode.dial_code,
    }),
  );

  const handleImageClick = () => {
    setProfileData({ ...profileData, image_url: "" });
  };

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    console.log("Fetching profile for userId:", userId);

    const profileResponse = await fetch(
      `/api/companies/my-profile?userId=${userId}`,
    );

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log("Fetched profile data:", profileData);

      setProfileData(profileData);

      if (profileData.country) {
        const countryOption = countries.find(
          (country) => country.value === profileData.country,
        );
        setSelectedCountry(countryOption || null);
      }

      if (profileData.phone_country_code) {
        const phoneCountryCodeOption = phoneCountryCodeOptions.find(
          (option) => option.value === profileData.phone_country_code,
        );
        setSelectedPhoneCountryCode(phoneCountryCodeOption || null);
      }

      setIsShowReferralSection(true);
    } else {
      console.log("No profile found or error:", profileResponse.status);
      setNoProfileFound(true);
    }
    setIsLoading(false);
  }, [userId, phoneCountryCodeOptions]);

  useEffect(() => {
    setNoProfileFound(false);

    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  const scrollToFirstError = (errors: { [key: string]: string }) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Define the order of fields as they appear on the page
    const fieldOrder = [
      "image_url",
      "designation",
      "headline",
      "email",
      "address",
      "city",
      "country",
      "phone_country_code",
      "phone_number",
      "telegram",
      "linkedin",
      "github",
      "twitter",
      "stackoverflow",
      "portfolio",
    ];

    // Find the first error field based on page order
    const firstErrorField =
      fieldOrder.find((field) => errorKeys.includes(field)) || errorKeys[0];

    // Find the element and scroll to it
    const element = document.querySelector(
      `[name="${firstErrorField}"], #${firstErrorField}, [data-field="${firstErrorField}"]`,
    );
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Focus the element if it's an input
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      ) {
        setTimeout(() => element.focus(), 500);
      }
    }
  };

  const handleFormSubmit = async (data: any, validate: boolean) => {
    setIsSaving(true);

    const isNewUser = !profileData.designation;
    const referralCode = Cookies.get("referralCode");
    const imageUrl = profileImage
      ? await uploadFileToBucket(profileImage)
      : profileData.image_url;

    const isAlreadyReferred = profileData.referrer ? true : false;

    const requiredFields = {
      headline: "Company description",
      designation: "Company name",
      address: "Address",
      email: "Email",
      country: "Country",
      city: "City",
      phone_country_code: "Phone country code",
      phone_number: "Phone number",
      telegram: "Telegram",
    };

    if (validate) {
      const newErrors: { [key: string]: string } = {};

      // Check for picture first
      if (
        !imageUrl ||
        (typeof imageUrl === "string" && imageUrl.trim() === "")
      ) {
        newErrors["image_url"] = "Profile picture is required";
        toast.error("🐝 Please upload a company profile picture!");
      }

      Object.entries(requiredFields).forEach(([key, label]) => {
        if (!data[key]) {
          newErrors[key] = `${label} is required`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        scrollToFirstError(newErrors);
        if (!newErrors["image_url"]) {
          toast.error("Please fill in all required fields");
        }
        setIsSaving(false);
        return;
      }
    }

    setErrors({}); // Clear errors if validation passes

    const dataForm = {
      headline: data.headline,
      user_id: userId,
      designation: data.designation,
      address: data.address,
      country: selectedCountry?.value,
      city: data.city,
      phone_country_code: selectedPhoneCountryCode?.value,
      phone_number: data["phone_number"],
      email: data.email,
      telegram: data.telegram,
      image_url: imageUrl,
      wallet_address: walletAddress,
      linkedin: data.linkedin,
      github: data.github,
      stackoverflow: data.stackoverflow,
      twitter: data.twitter,
      portfolio: data.portfolio,
      status: profileData.status || "pending",
      referrer: isAlreadyReferred ? null : referralCode,
      inreview: validate,
    };

    const filteredData = Object.fromEntries(
      Object.entries(dataForm).filter(
        ([, value]) => value != null && value !== "",
      ),
    );

    const profileResponse = await fetch("/api/companies/my-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filteredData),
    });

    setIsSaving(false);

    if (!profileResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      if (validate) {
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

        toast.success("Profile sent to review by the core team!");
      } else {
        toast.success("Profile Saved!");
        window.location.reload();
      }
    }
  };

  const handleFormSaving = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, false);
  };

  const handleFormReview = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, true);
  };

  if (!userId) {
    return (
      <h2 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 To Get Started Please Login First
      </h2>
    );
  }

  if (isLoading) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Loading Your Profile, Please Wait"} />;
  }
  if (isSaving) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Saving Your Profile..."} />;
  }

  return (
    <>
      <style jsx global>{`
        .quill-editor-custom .ql-toolbar {
          border: 1px solid #f59e0b !important;
          border-bottom: 1px solid #f59e0b !important;
          background: #fef3c7 !important;
          border-radius: 12px 12px 0 0 !important;
        }

        .quill-editor-custom .ql-container {
          border: 1px solid #f59e0b !important;
          border-top: none !important;
          font-size: 16px !important;
          min-height: 350px !important;
          border-radius: 0 0 12px 12px !important;
        }

        .quill-editor-custom .ql-editor {
          padding: 20px !important;
          min-height: 350px !important;
        }

        .quill-editor-custom .ql-editor::before {
          font-style: italic !important;
          color: #92400e !important;
        }
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          {/* Honeycomb Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
              {Array.from({ length: 144 }, (_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 border-2 border-amber-300 transform rotate-45"
                ></div>
              ))}
            </div>
          </div>

          {/* Floating Bees */}
          <div className="absolute top-20 right-20 w-8 h-8 opacity-60">
            <div
              className="relative animate-bounce"
              style={{ animationDelay: "0s", animationDuration: "4s" }}
            >
              <span className="text-2xl">🐝</span>
            </div>
          </div>

          <div className="absolute bottom-32 left-16 w-6 h-6 opacity-40">
            <div
              className="relative animate-bounce"
              style={{ animationDelay: "2s", animationDuration: "5s" }}
            >
              <span className="text-xl">🐝</span>
            </div>
          </div>
        </div>

        <div className="relative container mx-auto px-6 py-8">
          {/* Status Banners */}
          {noProfileFound && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl p-6 shadow-lg border-2 border-amber-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm"></div>
                <div className="relative flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      Getting Started
                    </h3>
                    <p className="text-amber-100">
                      Please create a profile to continue your hive journey!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {unapprovedProfile && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg border-2 border-blue-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm"></div>
                <div className="relative flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      Under Review
                    </h3>
                    <p className="text-blue-100">
                      Your profile is pending approval. It will be live soon
                      after review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {savedProfile && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 shadow-lg border-2 border-amber-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm"></div>
                <div className="relative flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-4 animate-pulse">
                    <span className="text-2xl">🐝</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      Almost Ready!
                    </h3>
                    <p className="text-amber-100">
                      Your profile is saved. Complete the mandatory fields and
                      submit for review when ready.
                    </p>
                  </div>
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Professional Header */}
          <div className="relative text-center mb-16 py-12">
            {/* Floating elements */}
            <div className="absolute top-4 left-1/4 w-16 h-16 bg-amber-400 bg-opacity-20 rounded-full blur-xl animate-pulse"></div>
            <div
              className="absolute bottom-4 right-1/4 w-20 h-20 bg-yellow-400 bg-opacity-15 rounded-full blur-xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>

            <div className="relative z-10">
              <div className="inline-flex items-center bg-white bg-opacity-60 backdrop-blur-sm text-amber-800 px-6 py-3 rounded-2xl text-sm font-semibold mb-6 shadow-lg border-2 border-amber-200 transform hover:-translate-y-1 transition-all duration-300">
                <span className="text-xl mr-3">🍯</span>
                <span className="text-lg">Company Hive Profile</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Build Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 mt-2">
                  Dream Company Profile
                </span>
              </h1>

              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
                Showcase your company's vision, culture, and opportunities to
                attract the finest Web3 talent from around the world
              </p>

              {/* Decorative line */}
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-400"></div>
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <div className="w-24 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-400"></div>
                <div
                  className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-yellow-400 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-amber-200 p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400 bg-opacity-20 rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-yellow-400 bg-opacity-15 rounded-full"></div>

            <form className="relative">
              <div className="flex flex-col items-center justify-center w-full mb-12">
                <div
                  className="flex justify-center mb-4"
                  data-field="image_url"
                >
                  <div className="relative">
                    <ProfileImageUpload
                      currentImage={profileData.image_url}
                      displayName={profileData.designation || ""}
                      onImageUpdate={(imageUrl) => {
                        setProfileData({
                          ...profileData,
                          image_url: imageUrl,
                        });
                        // Clear image error when image is uploaded
                        if (errors.image_url && imageUrl) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.image_url;
                            return newErrors;
                          });
                        }
                      }}
                      size={180}
                    />
                    {errors.image_url && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <p className="text-red-500 text-sm bg-white px-3 py-1 rounded-full shadow-md border border-red-200">
                          {errors.image_url}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full flex justify-center gap-4 mb-8">
                <Link href={`/companies/${userId}`}>
                  <button className="inline-flex items-center px-6 py-3 bg-white bg-opacity-80 text-amber-700 font-semibold rounded-xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transform hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg">
                    👁️ Public View
                  </button>
                </Link>

                {!noProfileFound && !unapprovedProfile && (
                  <Link href={`/companies/create-job`}>
                    <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
                      💼 Create Job
                    </button>
                  </Link>
                )}
              </div>

              {noProfileFound && (
                <div className="text-center mb-8">
                  <p className="text-amber-700 bg-amber-100 px-4 py-2 rounded-full inline-block">
                    🐝 Please create a profile before posting jobs!
                  </p>
                </div>
              )}

              {unapprovedProfile && (
                <div className="text-center mb-8">
                  <p className="text-blue-700 bg-blue-100 px-4 py-2 rounded-full inline-block">
                    ⏳ Profile approval required before creating jobs
                  </p>
                </div>
              )}
              {/* Clean Form Fields */}
              <div className="space-y-8">
                {/* Company Name */}
                <div className="flex-1">
                  <label
                    htmlFor="designation"
                    className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                  >
                    Company Name*
                  </label>
                  <input
                    name="designation"
                    className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="Enter your company name"
                    type="text"
                    maxLength={100}
                    defaultValue={profileData.designation}
                    onChange={(e) => {
                      setProfileData({
                        ...profileData,
                        designation: e.target.value,
                      });
                      // Clear error when user starts typing
                      if (errors.designation) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.designation;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.designation && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.designation as string}
                    </p>
                  )}
                </div>

                {/* Company Description - Increased Height */}
                <div className="mt-5">
                  <label
                    htmlFor="headline"
                    className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                  >
                    Company Description*
                  </label>
                  <div style={{ borderRadius: "12px" }}>
                    <ReactQuill
                      theme="snow"
                      modules={quillModules}
                      className="quill-editor-custom"
                      value={profileData.headline || ""}
                      onChange={(content) => {
                        setProfileData({ ...profileData, headline: content });
                        // Clear error when user starts typing
                        if (errors.headline) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.headline;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Describe your company, mission, values, and what makes you unique..."
                      style={{
                        fontSize: "1rem",
                        height: "400px", // Much taller like talent profile
                        marginBottom: "50px",
                      }}
                    />
                  </div>
                  {errors.headline && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.headline as string}
                    </p>
                  )}
                  <p className="text-amber-600 text-sm text-right w-full mt-12 font-medium">
                    {profileData.headline?.replace(/<[^>]*>/g, "")?.length || 0}{" "}
                    / 10,000
                  </p>
                </div>

                {/* Email */}
                <div className="flex-1">
                  <label
                    htmlFor="email"
                    className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                  >
                    Email Address*
                  </label>
                  <input
                    name="email"
                    className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="company@example.com"
                    type="email"
                    maxLength={255}
                    defaultValue={profileData.email}
                    onChange={(e) => {
                      setProfileData({ ...profileData, email: e.target.value });
                      // Clear error when user starts typing
                      if (errors.email) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email as string}
                    </p>
                  )}
                </div>

                {/* Address, City & Country Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="address"
                      className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                    >
                      Address*
                    </label>
                    <input
                      name="address"
                      className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                      placeholder="Company address"
                      type="text"
                      maxLength={100}
                      defaultValue={profileData.address}
                      onChange={(e) => {
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        });
                        // Clear error when user starts typing
                        if (errors.address) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.address;
                            return newErrors;
                          });
                        }
                      }}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address as string}
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
                    <label
                      htmlFor="city"
                      className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                    >
                      City*
                    </label>
                    <input
                      name="city"
                      className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                      placeholder="City name"
                      type="text"
                      pattern="[a-zA-Z \-]+"
                      maxLength={100}
                      defaultValue={profileData.city}
                      onChange={(e) => {
                        setProfileData({
                          ...profileData,
                          city: e.target.value,
                        });
                        // Clear error when user starts typing
                        if (errors.city) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.city;
                            return newErrors;
                          });
                        }
                      }}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.city as string}
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
                    <SelectInput
                      required={false}
                      labelText="Country"
                      name="country"
                      inputValue={selectedCountry}
                      setInputValue={(country: any) => {
                        setSelectedCountry(country);
                        setProfileData({ ...profileData, country });
                        // Clear error when country is selected
                        if (errors.country) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.country;
                            return newErrors;
                          });
                        }
                      }}
                      options={countries}
                      defaultValue={
                        countries[
                          countries.findIndex(
                            (country) => country.value === profileData?.country,
                          )
                        ]
                      }
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.country as string}
                      </p>
                    )}
                  </div>
                </div>
                {/* Phone Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex-1">
                    <SelectInput
                      required={false}
                      labelText="Phone Country Code"
                      name="phone_country_code"
                      inputValue={selectedPhoneCountryCode}
                      setInputValue={(phoneCountryCode: any) => {
                        setSelectedPhoneCountryCode(phoneCountryCode);
                        setProfileData({
                          ...profileData,
                          phone_country_code: phoneCountryCode?.value || "",
                        });
                        // Clear error when user selects
                        if (errors.phone_country_code) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.phone_country_code;
                            return newErrors;
                          });
                        }
                      }}
                      options={phoneCountryCodeOptions}
                      defaultValue={phoneCountryCodeOptions.find(
                        (option) =>
                          option.value === profileData?.phone_country_code,
                      )}
                    />
                    {errors.phone_country_code && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone_country_code as string}
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
                    <label
                      htmlFor="phone_number"
                      className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                    >
                      Phone Number*
                    </label>
                    <input
                      name="phone_number"
                      className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                      placeholder="Phone Number"
                      type="text"
                      pattern="[0-9]+"
                      maxLength={20}
                      defaultValue={profileData.phone_number}
                      onChange={(e) => {
                        setProfileData({
                          ...profileData,
                          phone_number: e.target.value,
                        });
                        // Clear error when user starts typing
                        if (errors.phone_number) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.phone_number;
                            return newErrors;
                          });
                        }
                      }}
                    />
                    {errors.phone_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone_number as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* Telegram */}
                <div className="flex-1">
                  <label
                    htmlFor="telegram"
                    className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                  >
                    Telegram*
                  </label>
                  <input
                    name="telegram"
                    className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="@your_telegram_handle"
                    type="text"
                    maxLength={100}
                    defaultValue={profileData.telegram}
                    onChange={(e) => {
                      setProfileData({
                        ...profileData,
                        telegram: e.target.value,
                      });
                      // Clear error when user starts typing
                      if (errors.telegram) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.telegram;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.telegram && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.telegram as string}
                    </p>
                  )}
                </div>

                {/* Social Media Links */}
                <div className="flex w-full flex-col mt-8">
                  <h3 className="inline-block ml-3 text-base font-medium text-gray-800 form-label mb-4">
                    Social Media Links (Optional):
                  </h3>
                  <div className="space-y-4">
                    {socialLinks.map((socialLink) => (
                      <SocialLink
                        key={socialLink.name}
                        name={socialLink.name}
                        icon={socialLink.icon}
                        placeholder={socialLink.placeholder}
                        defaultValue={
                          profileData[
                            socialLink.name as keyof typeof profileData
                          ]?.toString() || ""
                        }
                        setValue={(name, value) => {
                          setProfileData((prev) => ({
                            ...prev,
                            [name]: value,
                          }));
                        }}
                        errorMessage={
                          errors[socialLink.name as keyof typeof errors]
                        }
                      />
                    ))}
                  </div>
                </div>

                {isShowReferralSection && <ReferralSection />}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-6 pt-8 mt-8 border-t-2 border-amber-200">
                {isLoading ? (
                  <div className="flex gap-4">
                    <button
                      className="px-8 py-4 bg-amber-300 text-amber-600 font-semibold rounded-2xl opacity-50 cursor-not-allowed transition duration-150 ease-in-out flex items-center"
                      disabled
                    >
                      <div className="w-5 h-5 mr-2 animate-spin border-2 border-amber-600 border-t-transparent rounded-full"></div>
                      Saving...
                    </button>
                    {!profileData.approved && (
                      <button
                        className="px-8 py-4 bg-amber-300 text-amber-600 font-semibold rounded-2xl opacity-50 cursor-not-allowed transition duration-150 ease-in-out flex items-center"
                        disabled
                      >
                        <div className="w-5 h-5 mr-2 animate-spin border-2 border-amber-600 border-t-transparent rounded-full"></div>
                        Processing...
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-4 flex-wrap justify-center">
                    <button
                      className="group px-8 py-4 bg-white bg-opacity-80 text-amber-700 font-semibold rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl flex items-center"
                      onClick={handleFormSaving}
                    >
                      <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">
                        💾
                      </span>
                      Save Draft
                    </button>

                    {/* Only show Submit for Review if not approved */}
                    {!profileData.approved && (
                      <button
                        className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg flex items-center relative overflow-hidden"
                        type="submit"
                        onClick={handleFormReview}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center">
                          <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">
                            🚀
                          </span>
                          Submit for Review
                        </span>
                      </button>
                    )}

                    {/* Show approved status if profile is approved */}
                    {profileData.approved && (
                      <div className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl shadow-lg flex items-center">
                        <span className="mr-2">✅</span>
                        Profile Approved
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
