import React, { useState } from "react";
import { X } from "lucide-react";
import Cookies from "js-cookie";
import { UserProfile } from "@/app/user-profile/page";
import toast from "react-hot-toast";

interface ConnectEmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export function ConnectEmailPopup({
  isOpen,
  onClose,
  setUserProfile,
}: ConnectEmailPopupProps) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get the logged in user id from cookies
  const user_id = Cookies.get("user_id");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    handleConnectEmail(email, password);
  };

  const handleConnectEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/connect-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to connect email");
      }

      setUserProfile((prevProfile: UserProfile | null) => ({
        ...data.user,
      }));

      toast.success(data.message);

      onClose();
    } catch (error: any) {
      console.log(error, "error");
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">
            Connect Your Email
          </h2>
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all"
              placeholder="Create a password"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all"
              placeholder="Confirm your password"
              required
            />
          </div>
          {error && (
            <div>
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 transition-colors font-medium shadow-lg shadow-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            disabled={isLoading}
            style={{ lineHeight: "28px", fontSize: "16px", fontWeight: 500 }}
          >
            {isLoading ? (
              <div className="w-[28px] h-[28px] border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              "Connect Email"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
