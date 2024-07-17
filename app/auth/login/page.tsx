"use client";

import React from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

const Login = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    setIsLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseBody = await response.json();

    console.log(responseBody);
    if (response.ok) {
      setIsLoading(false);
      Cookies.set("user_email", responseBody.email);
      Cookies.set("user_id", responseBody.userId);
      window.location.href = "/talents/my-profile";
    } else {
      setIsLoading(false);
      toast.error(responseBody.message);
    }
  };

  return (
    <main className="m-8">
      <h1 className="my-5 font-bold text-2xl">Login</h1>
      <section className="">
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
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905]  hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
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
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600  rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Enter Your Password"
                name="password"
                type="password"
                required
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <p className="pl-4">
              If you don&apos;t have any account
              <Link
                href={"/auth/signup"}
                className="ml-2 text-[#FFC905] text-lg underline"
              >
                {" "}
                Sign up
              </Link>
            </p>
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
              Login
            </button>
          )}
        </form>
      </section>
    </main>
  );
};

export default Login;
