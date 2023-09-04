"use client";
//TODO update with actual data
// import { useEffect, useState } from 'react';

import { TalentProfile } from "../../../components/talent-card";

export default function TalentInformation() {
 /* const [talentsData, setTalentsData] = useState<Talent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const talentsResponse = await fetch('/api/companies/search-talents');
        if (!talentsResponse.ok) {
          throw new Error('Failed to fetch data from the server');
        }
        const talents = await talentsResponse.json();
        setTalentsData(talents);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, []);*/

  return (
    <div>
<TalentProfile
  image="/img/talent_avatar.png"
  firstName="John"
  lastName="Doe"
  jobHeadline="Web Developer"
  website="https://example.com"
  country="United States"
  city="New York"
  description="Experienced web developer with a passion for creating innovative and user-friendly applications."
  skills={["JavaScript", "React", "CSS", "HTML"]}
  aboutWork="I have worked on various web development projects, ranging from small business websites to large-scale enterprise applications."
  experiences={[
    {
      title: "Full Stack Developer",
      company: "ABC Company",
      location: "New York",
      startDate: "2018-01-01",
      endDate: "2020-12-31",
      employmentType: "Full-time",
      description: "Developed and maintained web applications using modern technologies.",
    },
    {
      title: "Frontend Developer",
      company: "XYZ Inc.",
      location: "Los Angeles",
      startDate: "2016-01-01",
      endDate: "2017-12-31",
      employmentType: "Contract",
      description: "Implemented responsive user interfaces and optimized website performance.",
    },
  ]}
  studies={[
    {
      field: "Computer Science",
      degree: "Bachelor of Science",
      school: "University of ABC",
      location: "New York",
      startDate: "2014-09-01",
      endDate: "2018-05-31",
      distinction: "Summa Cum Laude",
      description: "Studied various computer science concepts and gained practical programming skills.",
    },
  ]}
  contact={{
    phoneCountryCode: "+1",
    phoneNumber: "1234567890",
    email: "john.doe@example.com",
    telegram: "@johndoe",
  }}
/>


    </div>
  );
}
