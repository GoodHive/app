"use client";

import React from "react";
import { useForm, ValidationError } from "@formspree/react";
import { Send, CheckCircle } from "lucide-react";

const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;

export default function ContactForm() {
  
  const [state, handleSubmit] = useForm(formId || "placeholder");

  if (!formId) {
    return (
      <div className="text-center p-8 bg-amber-50 rounded-2xl border-2 border-amber-200">
        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-amber-800 mb-2">Contact Form Configuration Required</h3>
        <p className="text-amber-600">
          The contact form is currently not configured. Please add the NEXT_PUBLIC_FORMSPREE_FORM_ID environment variable.
        </p>
      </div>
    );
  }

  if (state.succeeded) {
    return (
      <div className="text-center p-8 bg-green-50 rounded-2xl border-2 border-green-200">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent Successfully! 🐝</h3>
        <p className="text-green-600">
          Thanks for reaching out! We&apos;ve received your message and our team
          will get back to you within 24 hours.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Your Name*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Your Email*
          </label>
          <input
            name="email"
            id="email"
            type="email"
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
            placeholder="john.doe@example.com"
            required
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} />
        </div>
        
        <div>
          <label
            htmlFor="subject"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
            placeholder="What can we help you with?"
          />
        </div>
        
        <div>
          <label
            htmlFor="message"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Message*
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none resize-none"
            placeholder="Tell us more about your needs or questions..."
            required
          ></textarea>
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
          />
        </div>
        
        <button
          type="submit"
          disabled={state.submitting}
          className="group w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg flex items-center justify-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 flex items-center">
            {state.submitting ? (
              <>
                <div className="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Send Message
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
}
