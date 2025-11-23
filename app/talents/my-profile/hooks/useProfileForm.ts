import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { resumeUploadSizeLimit } from "../constants";
import { CountryOption, ProfileData } from "../types";

export const useProfileForm = (user_id: string, countries: CountryOption[]) => {
  const isInitialMount = useRef(true);

  // Form state
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null,
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploadedCvLink, setIsUploadedCvLink] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Form validation
  const validateForm = useCallback(
    (data: ProfileData, requireAll: boolean): boolean => {
      if (!requireAll) return true;

      const requiredFields = {
        title: "Profile header",
        description: "Profile description",
        first_name: "First name",
        last_name: "Last name",
        country: "Country",
        city: "City",
        phone_country_code: "Phone country code",
        phone_number: "Phone number",
        email: "Email",
        about_work: "About work",
        telegram: "Telegram",
      };

      const newErrors: { [key: string]: string } = {};

      Object.entries(requiredFields).forEach(([key, label]) => {
        if (!data[key as keyof ProfileData]) {
          newErrors[key] = `${label} is required`;
        }
      });

      // Make skills mandatory for review submission
      if (!selectedSkills.length) {
        newErrors.skills = "Skills are required";
      }

      if (!data.talent && !data.mentor && !data.recruiter) {
        newErrors.role = "Select at least one role";
        toast.error("Select at least one role");
        return false;
      }

      if (requireAll && !data.cv_url && !cvFile) {
        newErrors.cv_url = "Please upload your CV";
      }

      if (Object.keys(newErrors).length > 0) {
        toast.error("Please fill in all required fields");
        return false;
      }

      return true;
    },
    [selectedSkills, cvFile],
  );

  // Form submission
  const handleFormSubmit = useCallback(
    async (
      profileData: ProfileData,
      user: any,
      fetchProfile: () => void,
      validate: boolean,
    ) => {
      try {
        // Validate form
        if (!validateForm(profileData, validate)) {
          return;
        }

        // Upload files if necessary
        let imageUrl = profileData.image_url;
        let cvUrl = profileData.cv_url;

        if (profileImage) {
          imageUrl = (await uploadFileToBucket(profileImage)) as string;
        }

        if (cvFile) {
          cvUrl = (await uploadFileToBucket(cvFile)) as string;
        }

        // Prepare form data
        const formData = {
          ...profileData,
          country: selectedCountry?.value,
          phone_country_code: selectedCountry?.phoneCode,
          skills: selectedSkills.join(","),
          image_url: imageUrl,
          cv_url: cvUrl,
          wallet_address: walletAddress,
          user_id,
        };

        if (validate && user?.referred_by) {
          formData.referred_by = user.referred_by;
        }

        // Submit form
        const profileResponse = await fetch("/api/talents/my-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, validate }),
        });

        if (profileResponse.ok) {
          // Send email when profile is sent for review
          if (validate) {
            try {
              // Fetch or create referral link for the user
              let referralLink = null;
              try {
                // First try to get existing referral
                const getReferralResponse = await fetch(
                  `/api/referrals/get-referral?user_id=${user_id}`,
                );

                if (getReferralResponse.ok) {
                  const referralData = await getReferralResponse.json();
                  if (referralData.referral_code) {
                    referralLink = `${window.location.origin}/?ref=${referralData.referral_code}`;
                  }
                } else {
                  // If no referral exists, create one
                  const createReferralResponse = await fetch(`/api/referrals/create-referral`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ user_id }),
                  });

                  if (createReferralResponse.ok) {
                    const newReferralData = await createReferralResponse.json();
                    if (newReferralData.referral_code) {
                      referralLink = `${window.location.origin}/?ref=${newReferralData.referral_code}`;
                    }
                  }
                }
              } catch (referralError) {
                console.error("Error handling referral:", referralError);
                // Continue with email sending even if referral fails
              }

              await fetch("/api/send-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: formData.email,
                  type: "new-talent",
                  subject: `Welcome to GoodHive, ${formData.first_name}! 🎉 Your profile has been sent for review`,
                  toUserName: `${formData.first_name} ${formData.last_name}`,
                  referralLink,
                }),
              });
            } catch (error) {
              console.error("Error sending email:", error);
            }
          }

          toast.success(
            validate
              ? "Profile sent to review by the core team!"
              : "Profile saved successfully",
          );
          fetchProfile();
        } else {
          const profileSavingErrorData = await profileResponse.json();
          toast.error(profileSavingErrorData.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while saving your profile");
      }
    },
    [
      validateForm,
      profileImage,
      cvFile,
      selectedCountry,
      selectedSkills,
      walletAddress,
      user_id,
    ],
  );

  // Event handlers
  const handleCvFileChange = useCallback((file: File | null) => {
    if (!file) return;

    if (file.size > 1024 * 1024 * Number(resumeUploadSizeLimit)) {
      toast.error(`File size should be less than ${resumeUploadSizeLimit} MB`);
      return;
    }

    setCvFile(file);
  }, []);

  const onCvInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      handleCvFileChange(event.target.files[0]);
    },
    [handleCvFileChange],
  );

  const handleCountryChange = useCallback((country: CountryOption) => {
    if (!country) return;
    setSelectedCountry(country);
  }, []);

  const handleSkillsChange = useCallback((skills: string[]) => {
    setSelectedSkills(skills);
  }, []);

  const handleInputChange = useCallback((name: string, value: any) => {
    // This will be handled by the parent component
  }, []);

  const handleToggleChange = useCallback((name: string, checked: boolean) => {
    // This will be handled by the parent component
  }, []);

  // Initialize form data
  const initializeFormData = useCallback(
    (data: ProfileData) => {
      if (isInitialMount.current) {
        if (data.country) {
          const countryObj = countries.find((c) => c.value === data.country);
          if (countryObj) {
            setSelectedCountry(countryObj);
          }
        }
        if (data.skills) {
          setSelectedSkills(data.skills.split(","));
        }
        isInitialMount.current = false;
      }
    },
    [countries],
  );

  return {
    selectedCountry,
    selectedSkills,
    profileImage,
    cvFile,
    isUploadedCvLink,
    walletAddress,
    handleFormSubmit,
    onCvInputChange,
    handleCountryChange,
    handleSkillsChange,
    handleInputChange,
    handleToggleChange,
    initializeFormData,
    setProfileImage,
    setCvFile,
    setIsUploadedCvLink,
    setWalletAddress,
  };
};
