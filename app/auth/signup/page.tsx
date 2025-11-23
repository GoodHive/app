"use client";

import React from "react";
import Cookies from "js-cookie";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { analytics } from "@/lib/analytics";

const Signup = () => {
  const referralCode = Cookies.get("referralCode");
  const { openConnectModal } = useAuthCheck();

  const [isLoading, setIsLoading] = React.useState(false);

  // Track signup page view
  React.useEffect(() => {
    analytics.pageViewed('signup_page');
    analytics.signupStarted(referralCode || 'direct');
  }, [referralCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirm-password"),
    };

    if (data.password !== data.confirmPassword) {
      window.alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: data.email,
        password: data.password,
        referred_by: referralCode,
      }),
    });

    const responseBody = await response.json();

    if (response.ok) {
      setIsLoading(false);
      analytics.signupCompleted('email', referralCode || 'direct');
      Cookies.remove("referralCode");
      window.alert("Account created! Please connect your wallet to continue.");
      void openConnectModal?.();
    } else {
      setIsLoading(false);
      analytics.errorOccurred('signup_failed', responseBody.message || 'Unknown signup error', 'signup_page');
      window.alert(responseBody.message || "Failed to sign up!");
    }
  };

  return (
    <main className="m-5">
      <section>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full mt-4 gap-4 sm:flex-col md:flex-col"
        >
          {/* Email Field */}
          <div className="w-6/12 sm:w-full md:w-full">
            <div className="flex-1">
              <label
                htmlFor="email"
                className="inline-block ml-3 mb-2 text-base text-black form-label"
              >
                Email*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Enter Your Email Address"
                name="email"
                type="email"
                required
                maxLength={100}
              />
            </div>
          </div>
          {/* Password Field */}
          <div className="w-6/12 sm:w-full md:w-full">
            <div className="flex-1">
              <label
                htmlFor="password"
                className="inline-block ml-3 mb-2 text-base text-black form-label"
              >
                Password*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Enter Your Password"
                name="password"
                type="password"
                required
                maxLength={100}
              />
            </div>
          </div>
          <div className="w-6/12 sm:w-full md:w-full">
            <div className="flex-1">
              <label
                htmlFor="confirm-password"
                className="inline-block ml-3 mb-2 text-base text-black form-label"
              >
                Confirm Password*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Confirm Your Password"
                name="confirm-password"
                type="password"
                required
                maxLength={100}
              />
            </div>
          </div>
          {/* Submit Button */}
          {isLoading ? (
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
              type="submit"
              disabled
            >
              Loading...
            </button>
          ) : (
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
              type="submit"
            >
              Sign Up
            </button>
          )}
        </form>
      </section>
    </main>
  );
};

export default Signup;
