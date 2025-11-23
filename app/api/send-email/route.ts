import * as React from "react";
import { Resend } from "resend";

import ContactCompanyTemplate from "@/app/email-templates/contact-company";
import ContactTalentTemplate from "@/app/email-templates/contact-talent";
import ContactUsTemplate from "@/app/email-templates/contact-us";
import ContactUsConfirmationTemplate from "@/app/email-templates/contact-us-confirmation";
import JobAppliedTemplate from "@/app/email-templates/job-applied";
import CompanyRegistrationTemplate from "@/app/email-templates/new-company-user";
import TalentRegistrationTemplate from "@/app/email-templates/new-talent-user";
import { GoodHiveContractEmail } from "@constants/common";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEMPLATES = {
  "contact-talent": ContactTalentTemplate,
  "job-applied": JobAppliedTemplate,
  "contact-company": ContactCompanyTemplate,
  "contact-us": ContactUsTemplate,
  "contact-us-confirmation": ContactUsConfirmationTemplate,
  "new-talent": TalentRegistrationTemplate,
  "new-company": CompanyRegistrationTemplate,
};

interface RequestContentType {
  name: string;
  toUserName?: string;
  email: string;
  type:
    | "contact-talent"
    | "job-applied"
    | "contact-company"
    | "contact-us"
    | "contact-us-confirmation"
    | "new-talent"
    | "new-company";
  subject: string;
  userEmail?: string;
  message: string;
  jobtitle?: string;
  userProfile?: string;
  jobLink?: string;
  referralLink?: string;
}

export async function POST(request: Request) {
  const {
    name,
    toUserName,
    email,
    type,
    subject,
    userEmail,
    message,
    userProfile,
    jobLink,
    referralLink,
  }: RequestContentType = await request.json();

  console.log(
    email,
    type,
    subject,
    toUserName,
    name,
    message,
    userProfile,
    "send-email-body",
  );

  try {
    if (type === "contact-us") {
      // Send email to GoodHive team
      const teamEmailResult = await resend.emails.send({
        from: "GoodHive <no-reply@goodhive.io>",
        to: GoodHiveContractEmail,
        subject,
        react: TEMPLATES[type]({ name, email, message }) as React.ReactElement,
      });

      // Send confirmation email to user
      const userEmailResult = await resend.emails.send({
        from: "GoodHive <no-reply@goodhive.io>",
        to: email,
        subject: "🍯 Thank you for contacting GoodHive!",
        react: TEMPLATES["contact-us-confirmation"]({
          name,
          email,
          message,
        }) as React.ReactElement,
      });

      if (teamEmailResult.error || userEmailResult.error) {
        console.error("Email sending errors:", {
          teamEmail: teamEmailResult.error,
          userEmail: userEmailResult.error,
        });
        return new Response(
          JSON.stringify({
            message: "Error sending email",
            errors: {
              teamEmail: teamEmailResult.error,
              userEmail: userEmailResult.error,
            },
          }),
          {
            status: 500,
          },
        );
      }
    } else {
      // Handle other email types as before
      const recipient = [email];
      const result = await resend.emails.send({
        from: "GoodHive <no-reply@goodhive.io>",
        to: recipient,
        subject,
        bcc: GoodHiveContractEmail,
        react: TEMPLATES[type]({
          name,
          toUserName,
          message,
          userProfile,
          jobLink,
          referralLink,
          email: userEmail || email,
        }) as React.ReactElement,
      });

      if (result.error) {
        console.error("Resend error >>", result.error);
        return new Response(
          JSON.stringify({
            message: "Error sending email",
            error: result.error,
          }),
          {
            status: 500,
          },
        );
      }
    }

    return new Response(JSON.stringify({ message: "Email sent" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ message: "Error sending email" }), {
      status: 500,
    });
  }
}
