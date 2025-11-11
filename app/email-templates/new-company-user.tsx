import { EmailTemplateProps } from "@/interfaces/email-template";
import * as React from "react";

export const CompanyRegistrationTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = (props) => {
  const { name } = props;
  return (
    <div>
      <p>Hi {name},</p>
      <p>
        A warm welcome to GoodHive! 🚀 Your journey in discovering and
        collaborating with the brightest minds in IT starts now. We&apos;re
        thrilled to have {name} join our community that&apos;s reshaping the
        Future of Work with values like excellence, commitment, service, and
        openness.
      </p>
      <p>
        Here&apos;s the first step: To ensure your profile is spot-on and aligns
        with your hiring needs, let&apos;s have a chat! Please schedule a
        45-minute meeting with us at{" "}
        <a href="https://calendly.com/benoit-kulesza/45-minutes-meeting.">
          https://calendly.com/benoit-kulesza/45-minutes-meeting
        </a>{" "}
        We&apos;re excited to learn more about {name} and how we can assist in
        finding your ideal IT talent.
      </p>
      <p>
        Got peers or partners who could benefit from joining GoodHive too? Feel
        free to share your experience and let them know about us. Together, we
        can build a network that transforms how companies and IT professionals
        connect.
      </p>
      <p>
        We&apos;re looking forward to our conversation and to supporting {name}{" "}
        in navigating this exciting landscape of IT talents. Let&apos;s create
        amazing opportunities together!
      </p>
      <br />
      <br />
      <p>Best Regards,</p>
      <p>The GoodHive Core Team 🐝</p>
      <a href="mailto:contact@goodhive.io">contact@goodhive.io</a>
      <p>GoodHive, 39 rue de l&apos;Arrivée 95880 Enghien les Bains - France</p>
    </div>
  );
};

export default CompanyRegistrationTemplate;
