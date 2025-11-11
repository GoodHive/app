"use client";

import { Button } from "@components/button";
import { MessageBoxModal } from "@components/message-box-modal";
import Cookies from "js-cookie";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";

interface Props {
  toEmail: string;
  toUserName: string;
}

export const TalentContactBtn = ({ toEmail, toUserName }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupModal, setIsPopupModal] = useState(false);
  const { user_id, checkAuthAndShowConnectPrompt } = useAuthCheck();
  const onContactMeBtnClickHandler = async () => {
    // Check if user is authenticated first
    if (!checkAuthAndShowConnectPrompt("contact this talent")) {
      return;
    }
    
    setIsLoading(true);
    const companyData = await fetch(
      `/api/companies/my-profile?userId=${user_id}`,
    );

    if (!companyData.ok) {
      toast.error("You don't have a company profile yet! Please create one.");
      setIsLoading(false);
      return;
    }

    const userProfile = await companyData.json();
    console.log(userProfile, "userProfile");
    if (!userProfile.approved) {
      setIsLoading(false);
      toast.error(
        "Only verified company can contact talent! Please wait for your company to be verified.",
      );
      return;
    }
    setIsPopupModal(true);
  };

  const onPopupModalCloseHandler = () => {
    setIsPopupModal(false);
    setIsLoading(false);
  };

  const onSubmitHandler = async (message: string) => {
    if (!message) {
      toast.error("Please complete the form!");
      return;
    }
    if (!user_id) {
      // This should not happen if checkAuthAndShowConnectPrompt passed
      // But keeping as fallback
      checkAuthAndShowConnectPrompt("send a message");
      return;
    }
    try {
      setIsPopupModal(false);
      const companyData = await fetch(
        `/api/companies/my-profile?userId=${user_id}`,
      );

      if (!companyData.ok) {
        toast.error("You don't have a company profile yet! Please create one.");
        return;
      }

      const userProfile = await companyData.json();
      if (!userProfile.approved) {
        toast.error(
          "Only verified company can contact talent! Please wait for your company to be verified.",
        );
        return;
      }
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: JSON.stringify({
          name: userProfile?.designation,
          toUserName,
          email: toEmail,
          type: "contact-talent",
          subject: `Goodhive - ${userProfile?.designation} interested in your profile`,
          userEmail: userProfile?.email,
          message,
          userProfile: `${window.location.origin}/companies/${user_id}`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Something went wrong!");
      } else {
        setIsLoading(false);
        toast.success("Message sent successfully!");
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="flex w-full justify-center gap-5 mb-12">
      <Button
        onClickHandler={onContactMeBtnClickHandler}
        text="Contact"
        type="secondary"
        size="medium"
        loading={isLoading}
      ></Button>
      {isPopupModal && (
        <MessageBoxModal
          title="Write your message:"
          messageLengthLimit={30}
          onSubmit={onSubmitHandler}
          onClose={onPopupModalCloseHandler}
        />
      )}
    </div>
  );
};
