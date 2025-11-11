"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";

interface MessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  message: string;
}

const schema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  message: yup
    .string()
    .required("Message is required")
    .min(10, "Message must be at least 10 characters"),
});

export const MessagePopup: React.FC<MessagePopupProps> = ({
  isOpen,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
          type: "contact-us",
          subject: `New Contact Message from ${data.name}`,
        }),
      });

      if (response.ok) {
        toast.success(
          "🍯 Message sent successfully! We'll buzz back to you soon!",
        );
        reset();
        onClose();
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
           style={{ margin: '0 auto' }}>
        {/* Decorative Header with Honeycomb Pattern */}
        <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 p-8 rounded-t-3xl overflow-hidden">
          {/* Honeycomb Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="grid grid-cols-6 gap-2 transform rotate-12 scale-150 -translate-x-4 -translate-y-4">
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 border-2 border-amber-300 transform rotate-45"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all duration-200"
            disabled={isSubmitting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header Content */}
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full mb-4">
              <span className="text-3xl">🐝</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Buzz with Us!
            </h2>
            <p className="text-amber-100 text-sm">
              Drop us a message and we'll get back to you
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                Your Name
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Enter your name..."
                className="w-full px-4 py-3 border-2 border-amber-100 rounded-xl focus:border-amber-400 focus:ring-0 bg-amber-50/30 text-gray-800 placeholder-gray-500 font-medium transition-all duration-200 hover:bg-amber-50/50"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 border-amber-100 rounded-xl focus:border-amber-400 focus:ring-0 bg-amber-50/30 text-gray-800 placeholder-gray-500 font-medium transition-all duration-200 hover:bg-amber-50/50"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Your Message
              </label>
              <textarea
                {...register("message")}
                rows={8}
                placeholder="Share your thoughts, questions, or feedback with our hive..."
                className="w-full px-4 py-3 border-2 border-amber-100 rounded-xl focus:border-amber-400 focus:ring-0 bg-amber-50/30 text-gray-800 placeholder-gray-500 font-medium resize-none transition-all duration-200 hover:bg-amber-50/50"
                disabled={isSubmitting}
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-full hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🍯</span>
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-amber-100 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <span className="mr-1">🔒</span>
              Your information is safe and secure with our hive
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};
