import Image from "next/image";

import { Card } from "@/app/components/card";
import { CompanyContactBtn } from "@/app/components/companies/company-contact-btn";
import { getCompanyData } from "@/lib/fetch-company-data";
import { getCompanyJobs, getSingleJob } from "@/lib/fetch-company-jobs";
import { JobCard } from "@components/job-card";
import { CompanySocialMediaAndContact } from "@/app/components/companies/profile-social-media-and-contact";

export const revalidate = 0;

type CompanyProfilePageProps = {
  params: {
    address: string;
  };
  searchParams: {
    id?: number;
  };
};

export default async function CompanyProfilePage(
  context: CompanyProfilePageProps
) {
  const { address } = context.params;
  const { id } = context.searchParams;
  const profileData = await getCompanyData(address);
  const jobs = await getCompanyJobs(address);
  const singleJob = await getSingleJob(id);

  const {
    headline,
    designation,
    address: streetAddress,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    linkedin,
    github,
    stackoverflow,
    portfolio,
    image_url,
  } = profileData;

  return (
    <main className="relative pt-16">
      <div className="bg-yellow-400 absolute w-full top-0 left-0 h-28 z-1"></div>
      <div className="container mx-auto flex mb-20 md:flex-col sm:flex-col md:gap-5 sm:gap-5">
        <div className="w-2/6 md:w-full sm:w-full mr-5 flex flex-col z-2">
          <div className="relative bg-white rounded-2xl flex flex-col items-center p-5 shadow-[2px_7px_20px_4px_#e2e8f0]">
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
              {designation}
            </h1>
            <h4 className="text-[#4E4E4E] text-base mb-4">
              {city}, {country}
            </h4>

            <div className="flex w-full justify-center gap-5 mb-12">
              <CompanyContactBtn toEmail={email} toUserName={designation} />
            </div>
            <div className="flex flex-col w-full px-5 justify-start">
              <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">Bio:</h3>
              <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
                {headline}
              </p>
              <div className="flex flex-col mb-10">
                <h4 className="text-[#3E3E3E] font-bold text-lg mb-5">
                  Social Media:
                </h4>
                <CompanySocialMediaAndContact
                  linkedin={linkedin}
                  telegram={telegram}
                  github={github}
                  stackoverflow={stackoverflow}
                  portfolio={portfolio}
                  email={email}
                  phone_country_code={phone_country_code}
                  phone_number={phone_number}
                  streetAddress={streetAddress}
                />
              </div>

              
            </div>
          </div>
        </div>
        <div className="w-4/6 md:w-full sm:w-full bg-white relative rounded-2xl flex flex-col items-center p-5 shadow-[2px_7px_20px_4px_#e2e8f0] z-2">
          {id && singleJob && (
            <div className="w-full flex flex-col mb-5">
              <h2 className="text-left w-full pl-5 mb-2 mt-5 text-2xl font-bold">
                Job Details:
              </h2>
              <div className="flex flex-col min-w-full gap-3 ">
                <JobCard
                  key={singleJob.id}
                  id={singleJob.id}
                  type="Job"
                  title={singleJob.title}
                  postedBy={singleJob.companyName}
                  details={singleJob.description}
                  duration={singleJob.duration}
                  image={singleJob.image_url || "/img/company_img.png"}
                  countryFlag="/img/country_flag.png"
                  city={singleJob.city}
                  country={singleJob.country}
                  typeEngagement={singleJob.typeEngagement}
                  jobType={singleJob.jobType}
                  projectType={singleJob.projectType}
                  budget={singleJob.budget}
                  skills={singleJob.skills}
                  buttonText="Connect"
                  walletAddress={singleJob.walletAddress}
                  companyEmail={email}
                  escrowAmount={singleJob.escrowAmount}
                />
              </div>
            </div>
          )}
          <h2 className="text-left w-full pl-5 mb-2 mt-5 text-2xl font-bold">
            Job listings:
          </h2>
          <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-1 md:grid-cols-1 sm:grid-cols-1 ">
            {jobs.map((job) => {
              if (singleJob && singleJob.id === job.id) return null;
              const {
                id,
                title,
                companyName,
                description,
                city,
                budget,
                projectType,
                skills,
                image_url,
                walletAddress,
                country,
                escrowAmount,
              } = job;
              return (
                <Card
                  key={id}
                  jobId={id}
                  type="company"
                  title={title}
                  postedBy={companyName}
                  postedOn="posted 2 days ago"
                  image={image_url || "/img/company_img.png"}
                  country={country}
                  city={city}
                  budget={budget}
                  projectType={projectType}
                  currency="USD"
                  description={description}
                  skills={skills}
                  buttonText="Apply"
                  walletAddress={walletAddress}
                  escrowAmount={escrowAmount}
                />
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
