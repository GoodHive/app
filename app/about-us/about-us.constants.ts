export const ABOUT_CONTENT = {
  hero: {
    title: "About GoodHive",
    subtitle: "Building the Future of Web3 Recruitment",
    description:
      "GoodHive is revolutionizing how companies and talent connect in the Web3 space. We're creating a decentralized, transparent, and efficient recruitment platform that empowers both employers and job seekers.",
  },
  philosophy: {
    title: "Our Philosophy",
    description:
      "Our philosophy is simple: hire great people and give them the resources and support to do their best work. We believe in transparency, collaboration, and empowering our community to thrive in the decentralized future.",
  },
  mission: {
    title: "Our Mission",
    description:
      "To create the leading Web3 talent marketplace where opportunities buzz with potential and every connection leads to meaningful collaboration.",
  },
};

export const TEAM_MEMBERS = [
  {
    id: 1,
    name: "Zaid Schwartz",
    role: "Founder & CEO",
    description:
      "Former co-founder of Opendoor. Early staff at Spotify and Clearbit.",
    imageUrl: "/img/team/member1.jpg",
    backgroundColor: "#d4e5e0",
  },
  {
    id: 2,
    name: "Lily-Rose Chedjou",
    role: "Engineering Manager",
    description:
      "Lead engineering teams at Netflix, Pitch, and Protocol Labs",
    imageUrl: "/img/team/member2.jpg",
    backgroundColor: "#e5d8d0",
  },
  {
    id: 3,
    name: "Amélie Laurent",
    role: "Product Designer",
    description: "Founding design team at Figma. Former Pleo, Stripe, and Tile.",
    imageUrl: "/img/team/member3.jpg",
    backgroundColor: "#e8d8e5",
  },
  {
    id: 4,
    name: "Riley O'Moore",
    role: "Frontend Developer",
    description:
      "Former frontend dev for Linear, Coinbase, and Postscript.",
    imageUrl: "/img/team/member4.jpg",
    backgroundColor: "#f5ecd0",
  },
  {
    id: 5,
    name: "Cameron Mitchell",
    role: "UX Researcher",
    description:
      "Lead user research at Stripe, Contractor.io, and Facebook.",
    imageUrl: "/img/team/member5.jpg",
    backgroundColor: "#d0e0f0",
  },
  {
    id: 6,
    name: "Jordan Park",
    role: "Backend Engineer",
    description:
      "Built distributed systems at Amazon and Cloudflare. Web3 infrastructure specialist.",
    imageUrl: "/img/team/member6.jpg",
    backgroundColor: "#dfe5d4",
  },
  {
    id: 7,
    name: "Sofia Chen",
    role: "Marketing Lead",
    description:
      "Growth marketing at Notion and Airtable. Community building expert.",
    imageUrl: "/img/team/member7.jpg",
    backgroundColor: "#e5e0d8",
  },
  {
    id: 8,
    name: "Alex Thompson",
    role: "DevOps Lead",
    description:
      "Infrastructure at GitHub, GitLab, and HashiCorp. Blockchain deployment specialist.",
    imageUrl: "/img/team/member8.jpg",
    backgroundColor: "#d8e0e8",
  },
];

export const VIDEO_CONFIG = {
  embedUrl: "https://www.youtube.com/embed/4ctDaQpfEEg?si=2HG1IOlBXr7bo6OE",
  title: "GoodHive: Revolutionizing Recruitment for Clients and Web3 Talent!",
};

import { Compass, Rocket, Users } from "lucide-react";

export const IMPACT_METRICS = [
  {
    id: "companies",
    value: "220+",
    label: "Partner companies",
    description: "Web3 teams discovering talent through GoodHive.",
  },
  {
    id: "placements",
    value: "1.2k",
    label: "Successful placements",
    description: "Matches completed across engineering, design, and product.",
  },
];

export const VALUE_PILLARS = [
  {
    id: "philosophy",
    icon: Compass,
    title: ABOUT_CONTENT.philosophy.title,
    description: ABOUT_CONTENT.philosophy.description,
  },
  {
    id: "mission",
    icon: Rocket,
    title: ABOUT_CONTENT.mission.title,
    description: ABOUT_CONTENT.mission.description,
  },
  {
    id: "community",
    icon: Users,
    title: "Community First",
    description:
      "We build with our ecosystem. Every feature is co-created with founders, contributors, and talent to keep incentives aligned.",
  },
];

export const JOURNEY_MOMENTS = [
  {
    id: "inception",
    year: "2019",
    label: "Journey Start",
    title: "Vision takes shape",
    description:
      "A small founding crew left traditional recruitment to design a decentralized alternative focused on trust and transparency.",
  },
  {
    id: "launch",
    year: "2021",
    label: "Namba to Shibu",
    title: "Marketplace launches",
    description:
      "GoodHive opens to the public, onboarding the first cohort of DAOs, Web3 studios, and independent builders.",
  },
  {
    id: "growth",
    year: "2023",
    label: "Onexand Point",
    title: "Global expansion",
    description:
      "We introduce compliance tooling, escrow, and community governance to power cross-border collaboration at scale.",
  },
];
