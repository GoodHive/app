import { Resend } from "resend";
import * as React from "react";
import JobAppliedTemplate from "@/app/email-templates/job-applied";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { name, email, jobtitle, userProfile } = await request.json();
  try {
    const { data, error } = await resend.emails.send({
      from: "GoodHive <no-reply@goodhive.io>",
      to: [email],
      subject: `Goodhive - ${name} applied for "${jobtitle}"`,
      react: JobAppliedTemplate({ name, userProfile }) as React.ReactElement,
    });

    if (error) {
      throw new Error("Something went wrong!");
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