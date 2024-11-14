"use client";

import {
  useRef,
  useState,
  FormEvent,
  useEffect,
  useContext,
  ChangeEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";

import toast from "react-hot-toast";

import DragAndDropFile from "@components/drag-and-drop-file";
import { SelectInput } from "@components/select-input";
import { AddressContext } from "@components/context";
// TODO: use button but before add the type of the button component (i.e. type="button" or type="submit")
// import { Button } from '../../components/button';
import { skills } from "@/app/constants/skills";
import { countries } from "@/app/constants/countries";
import LabelOption from "@interfaces/label-option";
import { resumeUploadSizeLimit } from "./constants";
import { ToggleButton } from "@components/toggle-button";
import { SocialLink } from "./social-link";
import { AutoSuggestInput } from "@components/autosuggest-input/autosuggest-input";
import { socialLinks } from "./constant";
import { Button } from "@/app/components/button";
import { useRouter } from "next/navigation";
import { uploadFileToBucket } from "@utils/upload-file-bucket";
import { createJobServices } from "@/app/constants/common";
import { ReferralSection } from "@/app/components/referral/referral-section";

export default function MyProfile() {
  const router = useRouter();
  const imageInputValue = useRef(null);
  const [reviewProfileLoading, setReviewProfileLoading] = useState(false);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<null | File>(null);
  const [cvFile, setCvFile] = useState<null | File>(null);
  const [isUploadedCvLink, setIsUploadedCvLink] = useState(false);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [isShowReferralSection, setIsShowReferralSection] = useState(false);
  const [saveOnly, setSaveOnly] = useState(false);
  const [profileData, setProfileData] = useState({
    title: "",
    description: "",
    first_name: "",
    last_name: "",
    country: "",
    city: "",
    phone_country_code: "",
    phone_number: "",
    email: "",
    about_work: "",
    rate: "",
    skills: [],
    image_url: "",
    cv_url: "",
    freelance_only: false,
    remote_only: false,
    telegram: "",
    linkedin: "",
    github: "",
    twitter: "",
    stackoverflow: "",
    portfolio: "",
    mentor: false,
    talent: false,
    recruiter: false,
    talent_status: null,
    mentor_status: null,
    recruiter_status: null,
    hide_contact_details: false,
    referrer: "",
    availability: false,
  });

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const user_email_auth = Cookies.get("user_email");

  const walletAddressFromContext = useContext(AddressContext);

  const loggedInUserEmail = Cookies.get("user_email");

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null,
  );

  const handleImageClick = () => {
    setProfileData({ ...profileData, image_url: "" });
  };

  const handlePublicViewClick = () => {
    router.push(`/talents/${walletAddress}`);
  };

  useEffect(() => {
    if (walletAddressFromContext) {
      setWalletAddress(walletAddressFromContext);
    }
  }, [walletAddressFromContext]);

  // checking if there is any user in the auth db with the same wallet address
  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const response = await fetch("/api/talents/wallet-address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: loggedInUserEmail }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { walletAddress } = await response.json();

        if (walletAddress) {
          if (walletAddress === "undefined") {
            setWalletAddress(null);
          }
          setWalletAddress(walletAddress);
        }
      } catch (error) {
        console.error("There was an error!", error);
      }
    };

    if (!walletAddress && loggedInUserEmail) {
      fetchWalletAddress();
    }
  }, [loggedInUserEmail, walletAddress]);

  // fetching the profile data of the user with wallet address
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log(user_email_auth, "User Email Auth");

        if (!user_email_auth) {
          router.push(`/auth/login`);
        }

        const response = await fetch(
          `/api/talents/my-profile?walletAddress=${walletAddress}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const profile = await response.json();

        if (profile.cv_url) setIsUploadedCvLink(true);

        setProfileData(profile);
        setSelectedSkills(profile.skills.split(","));
        setIsShowReferralSection(true);
      } catch (error) {
        console.error("There was an error!", error);
      }
    };
    if (walletAddress) {
      fetchProfileData();
    }
  }, [walletAddress, user_email_auth, router]);

  useEffect(() => {
    const storeWalletAddress = async () => {
      try {
        const response = await fetch("/api/auth/set-wallet-address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: walletAddress,
            userId: Number(Cookies.get("user_id")),
          }),
        });
      } catch (error) {
        console.log(error, "Error...On Storing Wallet Address...");
      }
    };

    const walletAddressIsNotNull = walletAddress !== null;
    const walletAddressIsNotUndefined = walletAddress !== "undefined";

    if (walletAddressIsNotNull && walletAddressIsNotUndefined)
      storeWalletAddress();
  }, [walletAddress]);

  const onCvInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const cvFile = event.target.files[0];

    if (cvFile.size > 1024 * 1024 * Number(resumeUploadSizeLimit)) {
      toast.error(`File size should be less than ${resumeUploadSizeLimit} MB`);
      return;
    }
    setCvFile(cvFile);
  };

  // const handleSubmit = async (
  //   event: FormEvent<HTMLFormElement>,
  //   saveTalentOnly: boolean,
  // ) => {
  //   event.preventDefault();
  //   if (saveTalentOnly) {
  //     setSaveProfileLoading(true);
  //   } else {
  //     setReviewProfileLoading(true);
  //   }

  //   const isNewUser = !profileData.first_name;
  //   const formData = new FormData(event.currentTarget);
  //   const referralCode = Cookies.get("referralCode");

  //   const imageUrl = await uploadFileToBucket(profileImage);
  //   const cvUrl = await uploadFileToBucket(cvFile);
  //   const freelanceOnly =
  //     formData.get("freelance-only") === "on" ? true : false;
  //   const remoteOnly = formData.get("remote-only") === "on" ? true : false;
  //   const talent = formData.get("talent") === "on" ? true : false;
  //   const mentor = formData.get("mentor") === "on" ? true : false;
  //   const recruiter = formData.get("recruiter") === "on" ? true : false;
  //   const hideContactDetails =
  //     formData.get("hide-contact-details") === "on" ? true : false;
  //   const availability = formData.get("availability") === "on" ? true : false;

  //   const isAlreadyReferred = profileData.referrer ? true : false;

  //   if (!cvUrl && !isUploadedCvLink) {
  //     if (saveTalentOnly) {
  //       setSaveProfileLoading(false);
  //     } else {
  //       setReviewProfileLoading(false);
  //     }
  //     toast.error("CV upload failed!");
  //     return;
  //   }

  //   const dataForm = {
  //     title: formData.get("title"),
  //     description: formData.get("description"),
  //     firstName: formData.get("first-name"),
  //     lastName: formData.get("last-name"),
  //     country: selectedCountry?.value,
  //     city: formData.get("city"),
  //     phoneCountryCode: formData.get("phone-country-code"),
  //     phoneNumber: formData.get("phone-number"),
  //     email: formData.get("email"),
  //     aboutWork: formData.get("about-work"),
  //     rate: formData.get("rate"),
  //     freelanceOnly,
  //     remoteOnly,
  //     skills: selectedSkills,
  //     imageUrl: imageUrl || profileData.image_url,
  //     cvUrl: cvUrl || profileData.cv_url,
  //     walletAddress,
  //     linkedin: formData.get("linkedin"),
  //     github: formData.get("github"),
  //     twitter: formData.get("twitter"),
  //     stackoverflow: formData.get("stackoverflow"),
  //     portfolio: formData.get("portfolio"),
  //     telegram: formData.get("telegram"),
  //     talent,
  //     mentor,
  //     recruiter,
  //     talentStatus: saveTalentOnly
  //       ? profileData.talent_status
  //         ? profileData.talent_status
  //         : null
  //       : profileData.talent_status !== "approved"
  //         ? "pending"
  //         : profileData.talent_status,
  //     mentorStatus: profileData.mentor_status || mentor ? "pending" : null,
  //     recruiterStatus:
  //       profileData.recruiter_status || recruiter ? "pending" : null,
  //     hideContactDetails,
  //     referralCode: isAlreadyReferred ? null : referralCode,
  //     availability,
  //   };

  //   const profileResponse = await fetch("/api/talents/my-profile", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(dataForm),
  //   });

  //   if (saveTalentOnly) {
  //     setSaveProfileLoading(false);
  //   } else {
  //     setReviewProfileLoading(false);
  //   }
  //   if (!profileResponse.ok) {
  //     1;
  //     toast.error("Something went wrong!");
  //   } else {
  //     if (isNewUser) {
  //       await fetch("/api/send-email", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           email: dataForm.email,
  //           type: "new-talent",
  //           subject: `Welcome to GoodHive, ${dataForm.firstName}! 🎉 Let's Shape the Future of Work Together`,
  //         }),
  //       });
  //     }
  //     if (
  //       profileData.talent_status === "approved" ||
  //       profileData.mentor_status === "approved" ||
  //       profileData.recruiter_status === "approved"
  //     ) {
  //       toast.success(`🎉 Your profile has been successfully saved!`);
  //     } else {
  //       toast.success(`🎉 Your profile has been successfully saved!
  //         ${saveTalentOnly ? " " : " It is now under review."}
  //      `);
  //     }
  //   }
  // };
  //
  // TODO: Connect the relevant message
  // const PendingApprovalMessage = () => (
  //   <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
  //     🚀 Your profile is pending approval. It will be live soon.
  //   </p>
  // );

  // const PendingRecruiterApprovalMessage = () => (
  //   <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
  //     🚀 Your profile is approved as a talent but pending approval as a
  //     recruiter.
  //   </p>
  // );

  // const PendingMentorApprovalMessage = () => (
  //   <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
  //     🚀 Your profile is approved as a talent but pending approval as a mentor.
  //   </p>
  // );
  // const ConnectWalletMessage = () => (
  //   <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
  //     🚀 To get started, please connect your wallet. This will enable you to
  //     create or save your profile. Thanks!
  //   </p>
  // );

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
    saveTalentOnly: boolean,
  ) => {
    setSaveOnly(true);
    return console.log(profileData, "Profile Data...");
  };
  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const description = event.target.value;
    setProfileData({ ...profileData, description });
  };

  const handleAboutWorkChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const about_work = event.target.value;
    setProfileData({ ...profileData, about_work });
  };

  return (
    <main className="container mx-auto">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 pb-2">
        My Profile
      </h1>

      {/** 
      // TODO: Show the error message relevant to this page
      <>
        {profileData.talent_status === "pending" && <PendingApprovalMessage />}
        {profileData.talent_status === "approved" &&
          profileData.recruiter_status === "pending" && (
            <PendingRecruiterApprovalMessage />
          )}
        {profileData.talent_status === "approved" &&
          profileData.mentor_status === "pending" && (
            <PendingMentorApprovalMessage />
          )}
      </> **/}

      <section>
        <form
          onSubmit={(e: any) => {
            const isSaveTalentOnly =
              e.nativeEvent.submitter.name === "save-talent-only";
            if (isSaveTalentOnly) {
              handleSubmit(e, true);
            } else {
              handleSubmit(e, false);
            }
          }}
        >
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
          <div className="w-full flex justify-center mt-7">
            <Button
              text="Public View"
              type="secondary"
              size="medium"
              onClickHandler={handlePublicViewClick}
            />
          </div>
          <div className="flex w-full justify-center mt-5">
            <label
              htmlFor="availability"
              className="inline-block ml-3 mr-5 text-base text-black form-label"
            >
              Set Availability*
            </label>
            <ToggleButton
              label="Active"
              name="availability"
              checked={profileData.availability}
              tooltip="If Seeking Jobs"
            />
          </div>
          <div className="flex flex-col w-full mt-10">
            <div>
              <label
                htmlFor="title"
                className="inline-block ml-3 text-base text-black form-label"
              >
                Profile header*
              </label>
            </div>
            <input
              className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
              placeholder="Title"
              name="title"
              type="text"
              required={!saveOnly}
              maxLength={100}
              defaultValue={profileData?.title}
            />
            <div className="mt-5">
              <textarea
                name="description"
                className="form-control block w-full px-4 py-2 pb-4 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Describe your skills and experience in a few words*"
                required
                maxLength={5000}
                rows={8}
                defaultValue={profileData?.description}
                onChange={handleDescriptionChange}
              />
              <p
                className="text-[13px] mt-2 text-right w-full"
                style={{ color: "#FFC905" }}
              >
                {profileData.description.length}/5000
              </p>
            </div>
            <div className="flex gap-4 mt-4 sm:flex-col">
              <div className="flex-1">
                <label
                  htmlFor="first-name"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  First Name*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="First Name"
                  name="first-name"
                  type="text"
                  required
                  pattern="[a-zA-Z -]+"
                  maxLength={100}
                  defaultValue={profileData?.first_name}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="last-name"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Last Name*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Last Name"
                  name="last-name"
                  type="text"
                  required
                  pattern="[a-zA-Z -]+"
                  maxLength={100}
                  defaultValue={profileData?.last_name}
                />
              </div>
            </div>
            <div className="flex sm:flex-col gap-4 mt-4">
              <div className="flex-1">
                <SelectInput
                  labelText="Country"
                  name="country"
                  required
                  inputValue={selectedCountry}
                  setInputValue={setSelectedCountry}
                  options={countries}
                  defaultValue={
                    countries[
                      countries.findIndex(
                        (country) => country.value === profileData?.country,
                      )
                    ]
                  }
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
                  defaultValue={profileData?.city}
                />
              </div>
            </div>
            <div className="flex sm:flex-col gap-4 mt-4">
              <div className="flex-1">
                <label
                  htmlFor="phone-country-code"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Phone Country Code*
                </label>
                <div className="relative">
                  <input
                    className="pl-8 form-control block w-full py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                    placeholder="Phone Country Code"
                    type="text"
                    name="phone-country-code"
                    value={selectedCountry?.phoneCode || "+1"}
                    defaultValue={
                      countries[
                        countries.findIndex(
                          (country) => country.value === profileData?.country,
                        )
                      ]?.phoneCode
                    }
                    readOnly
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
                  type="number"
                  required
                  name="phone-number"
                  maxLength={20}
                  defaultValue={profileData?.phone_number}
                />
              </div>
            </div>
            <div className="flex sm:flex-col gap-4 mt-4">
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
                  name="email"
                  maxLength={255}
                  defaultValue={profileData?.email}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="rate"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Rate (USD/Hour)
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Your rate per hour"
                  type="number"
                  name="rate"
                  maxLength={255}
                  defaultValue={profileData?.rate}
                />
              </div>
            </div>
            <div className="w-full mt-5 pl-2">
              <ToggleButton
                label="Hide my contact details"
                name="hide-contact-details"
                checked={profileData.hide_contact_details}
              />
            </div>
            <div className="mt-4">
              <label
                htmlFor="about-work"
                className="inline-block ml-3 text-base text-black form-label"
              >
                About your Work*
              </label>
              <textarea
                name="about-work"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="What you are looking for?"
                required
                rows={8}
                maxLength={5000}
                defaultValue={profileData?.about_work}
                onChange={handleAboutWorkChange}
              />
              <p
                className="text-[13px] mt-2 text-right w-full"
                style={{ color: "#FFC905" }}
              >
                {profileData.about_work.length}/5000
              </p>
            </div>
            <div className="mt-4">
              <label
                htmlFor="cv"
                className="inline-block ml-3 text-base text-black form-label"
              >
                CV*
              </label>
              {isUploadedCvLink ? (
                <div className="flex items-center gap-3 p-3">
                  <Link
                    href={{ pathname: profileData.cv_url }}
                    target="_blank"
                    className="text-base font-normal text-blue-300 underline"
                  >
                    Your uploaded cv
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsUploadedCvLink(false)}
                    className="w-6 text-black bg-gray-400 rounded-full"
                  >
                    &#10005;
                  </button>
                </div>
              ) : (
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="CV"
                  type="file"
                  required
                  name="cv"
                  accept=".pdf"
                  onChange={onCvInputChange}
                />
              )}
            </div>

            <div className="flex w-full justify-between mt-9 sm:flex-wrap sm:gap-3">
              <ToggleButton
                label="Freelance Only"
                name="freelance-only"
                checked={profileData.freelance_only}
              />
              <ToggleButton
                label="Remote Only"
                name="remote-only"
                checked={profileData.remote_only}
              />
            </div>

            <div className="relative flex flex-col gap-4 mt-12 mb-2 z-30 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block ml-3 text-base font-bold text-black form-label"
                >
                  Skills*
                </label>
                <div className="absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ">
                  <AutoSuggestInput
                    inputs={skills}
                    selectedInputs={selectedSkills}
                    setSelectedInputs={setSelectedSkills}
                  />
                </div>
                <div className="pt-10">
                  {!!selectedSkills && selectedSkills.length > 0 && (
                    <div className="flex flex-wrap mt-4 ">
                      {selectedSkills.map((skill, index) => (
                        <div
                          key={index}
                          className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                        >
                          <span className="mr-2">{skill}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSkills(
                                selectedSkills.filter((_, i) => i !== index),
                              );
                            }}
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
            <div className="flex flex-col mt-3">
              <p className="my-4">I want to be:</p>
              <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:px-1 sm:flex-wrap sm:gap-3">
                {createJobServices.map((service) => {
                  const { label, value } = service;
                  const isChecked = profileData[value];
                  return (
                    <ToggleButton
                      key={value}
                      label={label}
                      name={value}
                      checked={isChecked}
                    />
                  );
                })}
              </div>
            </div>

            {/* Social media links: Linkedin, github, stackoverflow, telegram, portfolio */}
            <div className="flex w-full flex-col mt-7 mb-12">
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
                  setValue={(value) => {
                    console.log("Social link value changed:", value);
                  }}
                />
              ))}
            </div>

            {isShowReferralSection && <ReferralSection />}

            <div className="mt-10 mb-16 text-center flex gap-4 justify-center">
              <>
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                  name="save-talent-only"
                  disabled={saveProfileLoading}
                >
                  {saveProfileLoading ? "Saving Profile..." : "Save Profile"}
                </button>
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                  name="send-for-review"
                  disabled={reviewProfileLoading}
                >
                  {reviewProfileLoading
                    ? "Sending Profile To Review..."
                    : "Send Profile To Review"}
                </button>
              </>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
