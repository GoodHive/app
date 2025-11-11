"use client";

import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import styles from "./profile-social-media-and-contact.module.scss";
import { MessagePopup } from "@components/message-popup";

import Cookies from "js-cookie";

type Props = {
  linkedin?: string;
  telegram?: string;
  github?: string;
  stackoverflow?: string;
  twitter: string;
  portfolio?: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  streetAddress: string;
  companyName: string;
};


// A utility function to create a social link with a consistent style
const SocialLink = ({ href, iconSrc, alt, brandClass }) => (
  <Link href={{ pathname: href }} target="_blank">
    <div className={`${styles.socialLink} ${styles[brandClass]}`}>
      <Image src={iconSrc} alt={alt} fill className={styles.socialIcon} />
    </div>
  </Link>
);

// A utility component for displaying contact information
const ContactInfo = ({ icon, label, value }) => (
  <div className={styles.contactInfoItem}>
    <div className={styles.contactIcon}>{icon}</div>
    <div className={styles.contactDetails}>
      <p className={styles.contactLabel}>{label}</p>
      <p className={styles.contactValue}>{value}</p>
    </div>
  </div>
);

export const CompanySocialMediaAndContact: FC<Props> = (props) => {
  const {
    linkedin,
    telegram,
    github,
    twitter,
    stackoverflow,
    portfolio,
    email,
    phone_country_code,
    phone_number,
    streetAddress,
    companyName,
  } = props;
  const [isShowDetails, setIsShowDetails] = useState(false);
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
  const user_id = Cookies.get("user_id");

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const data = await fetch(`/api/talents/my-profile?user_id=${user_id}`);
        if (data.ok) {
          const userProfileData = await data.json();
          if (userProfileData.approved) {
            setIsShowDetails(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch talent data:", error);
      }
    };

    if (user_id) {
      fetchCompanyData();
    }
  }, [user_id]);

  const socialLinks = [
    { href: linkedin, icon: "/icons/linkedin.svg", alt: "LinkedIn", brandClass: "linkedin" },
    { href: `https://t.me/${telegram}`, icon: "/icons/telegram.svg", alt: "Telegram", show: isShowDetails, brandClass: "telegram" },
    { href: github, icon: "/icons/github.svg", alt: "GitHub", brandClass: "github" },
    { href: stackoverflow, icon: "/icons/stackoverflow.svg", alt: "Stack Overflow", brandClass: "stackoverflow" },
    { href: twitter, icon: "/icons/twitter.jpg", alt: "Twitter", brandClass: "twitter" },
    { href: portfolio, icon: "/icons/portfolio.svg", alt: "Portfolio", brandClass: "portfolio" },
  ].filter(link => link.href && (link.show === undefined || link.show));

  return (
    <div className={styles.contactContainer}>
      {/* Social Media Section */}
      <div className={`${styles.section} ${styles.socialSection}`}>
        <h4 className={styles.sectionTitle}>Follow Our Journey</h4>
        <div className={styles.socialLinksContainer}>
          {socialLinks.map((social) => (
            <SocialLink
              key={social.alt}
              href={social.href}
              iconSrc={social.icon}
              alt={social.alt}
              brandClass={social.brandClass}
            />
          ))}
        </div>
      </div>

      {/* Contact Info Section */}
      <div className={`${styles.section} ${styles.contactSection}`}>
        <h4 className={styles.sectionTitle}>Get in Touch</h4>
        {!isShowDetails ? (
          <div className={styles.restrictedAccess}>
            <p className={styles.restrictedTitle}>Access Restricted</p>
            <p className={styles.restrictedDescription}>Contact details are available to validated talents.</p>
          </div>
        ) : (
          <div className={styles.contactInfoList}>
            <ContactInfo
              label="Email"
              value={email}
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>}
            />
            <ContactInfo
              label="Phone"
              value={`${phone_country_code ? "" : "+"}${phone_country_code} ${phone_number}`}
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.76a11.034 11.034 0 006.364 6.364l.76-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>}
            />
            <ContactInfo
              label="Address"
              value={streetAddress}
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
            />
          </div>
        )}
      </div>

      {/* Contact Us Section */}
      <div className={`${styles.section} ${styles.contactSection}`}>
        <h4 className={styles.sectionTitle}>Contact GoodHive</h4>
        <div className={styles.contactUsContainer}>
          <p className={styles.contactUsDescription}>
            Have questions about {companyName}? Send us a message and we'll help you connect!
          </p>
          <button
            onClick={() => setIsMessagePopupOpen(true)}
            className={styles.contactUsButton}
          >
            <MessageCircle className={styles.contactUsIcon} />
            <span>Send us a Message</span>
          </button>
        </div>
      </div>

      {/* Message Popup Modal */}
      <MessagePopup
        isOpen={isMessagePopupOpen}
        onClose={() => setIsMessagePopupOpen(false)}
      />
    </div>
  );
};
