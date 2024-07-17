import Image from "next/image";
import Link from "next/link";

import { TalentSocialMedia } from "@/app/components/talents/profile-social-media";
import { TalentContactBtn } from "@/app/components/talents/talent-contact-btn";
import { getProfileData } from "@/lib/fetch-profile-data";
import { generateAvailabilityStatus } from "./utils";

export const revalidate = 0;

type MyProfilePageProps = {
  params: {
    address: string;
  };
  searchParams: {
    vkey: string;
    ref: string;
  };
};

export default async function MyProfilePage(context: MyProfilePageProps) {
  const { address } = context.params;
  const { vkey, ref } = context.searchParams;

  const isValidVkey = vkey === process.env.NEXT_PUBLIC_ADMIN_VERIFICATION_KEY;

  console.log(ref, isValidVkey);

  const profileData = await getProfileData(address);
  const {
    skills,
    title,
    first_name,
    last_name,
    image_url,
    about_work,
    cv_url,
    description,
    email,
    phone_number,
    phone_country_code,
    city,
    rate,
    country,
    linkedin,
    telegram,
    github,
    stackoverflow,
    portfolio,
    freelance_only,
    remote_only,
    talent_status,
    mentor_status,
    recruiter_status,
    hide_contact_details,
  } = profileData;

  const availabilityStatus = generateAvailabilityStatus(
    freelance_only,
    remote_only
  );

  if (ref === "admin" && isValidVkey === false) return;
  if (ref !== "admin" && talent_status === "pending")
    return (
      <div>
        <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
          🚀 This account is still under review. Account will be live soon.
        </p>
      </div>
    );

  return (
    <main className="relative pt-16">
      <div className="bg-yellow-400 absolute w-full top-0 left-0 h-28 z-10"></div>
      <div className="container mx-auto mb-20 bg-white w-full relative rounded-2xl flex flex-col items-center p-5 z-20 shadow-[2px_7px_20px_4px_#e2e8f0]">
        <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
          <div
            className="relative h-[180px] w-[180px] flex items-center justify-center cursor-pointer bg-gray-100"
            style={{
              clipPath:
                "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
            }}
          >
            <Image
              className="object-cover"
              src={image_url || "/img/placeholder-image.png"}
              alt="profile-picture"
              fill
            />
          </div>
        </div>
        <h1 className="text-[#4E4E4E] text-3xl font-bold mb-3">
          {`${first_name} ${last_name}`}
        </h1>
        <h3 className="text-[#4E4E4E] text-xl font-bold mb-3">{title}</h3>
        <h4 className="text-[#4E4E4E] text-base mb-4">
          {city}, {country}
        </h4>
        {rate && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            {rate} USD/hr
          </h4>
        )}
        {availabilityStatus && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            {availabilityStatus}
          </h4>
        )}
        {talent_status === "approved" && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            • I can help you as a talent
          </h4>
        )}
        {mentor_status === "approved" && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            • I can help you as a mentor
          </h4>
        )}
        {recruiter_status === "approved" && (
          <h4 className="text-[#4E4E4E] text-base font-medium mb-7">
            • I can help you as a recruiter
          </h4>
        )}
        <div className="flex w-full justify-center gap-5 mb-12">
          <TalentContactBtn toEmail={email} toUserName={first_name} />
          {/* <Button text="Hire me" type="primary" size="medium"></Button> */}
        </div>
        <div className="flex flex-col w-1/2">
          <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">Bio:</h3>
          <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
            {description}
          </p>

          {(talent_status === "approved" ||
            mentor_status === "approved" ||
            recruiter_status === "approved") && (
            <>
              <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">
                I Can Help You As:
              </h3>
              <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
                {`${talent_status === "approved" ? "Talent " : ""}${
                  mentor_status === "approved" ? "Mentor " : ""
                }${recruiter_status === "approved" ? "Recruiter" : ""}`}
              </p>
            </>
          )}
          <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">
            About my work:
          </h3>
          <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
            {about_work}
          </p>

          <TalentSocialMedia
            linkedin={linkedin}
            telegram={telegram}
            github={github}
            stackoverflow={stackoverflow}
            portfolio={portfolio}
          />

          <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">
            Specialization and Skills
          </h3>

          <div className="flex flex-wrap gap-2 mb-10">
            {!!skills.length &&
              skills.split(",").map((skill: string) => (
                <div
                  key={skill}
                  className="border-[#FFC905] flex items-center bg-gray-200 rounded-full px-4 py-1 text-sm m-1"
                >
                  <p>{skill}</p>
                </div>
              ))}
          </div>

          {cv_url && talent_status === "approved" && (
            <>
              <h3 className="text-[#4E4E4E] text-lg font-bold mb-3">
                Resume/CV:
              </h3>

              <div className="relative w-12 h-10 mb-7">
                <Link href={cv_url} target="_blank">
                  <Image src="/icons/resume.svg" alt="resume-icon" fill />
                </Link>
              </div>
            </>
          )}

          {/* {!hide_contact_details && (
            <div>
              <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">
                Contact info
              </h3>
              <div className="flex w-full justify-between mb-8">
                <h4 className="text-[#4E4E4E] text-base font-bold">Email</h4>
                <p className="text-[#4E4E4E] text-base">{email}</p>
              </div>
              <div className="flex w-full justify-between mb-8">
                <h4 className="text-[#4E4E4E] text-base font-bold">Phone</h4>
                <p className="text-[#4E4E4E] text-base">
                  +{`${phone_country_code} ${phone_number}`}
                </p>
              </div>
              <div className="flex w-full justify-between mb-8">
                <h4 className="text-[#4E4E4E] text-base font-bold">Address</h4>
                <p className="text-[#4E4E4E] text-base">
                  {city}, {country}
                </p>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </main>
  );
}
