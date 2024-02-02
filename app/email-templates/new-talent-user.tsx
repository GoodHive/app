import { EmailTemplateProps } from "@/interfaces/email-template";
import * as React from "react";

export const TalentRegistrationTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = (props) => {
  const { name } = props;
  return (
    <div>
      <p>Hi {name},</p>
      <p>
        Big cheers for hopping on board at GoodHive! 🚀 You&apos;re now part of
        a vibrant journey towards crafting the Future of Work. We&apos;re all
        about excellence, commitment, service, and openness here, and it&apos;s
        fantastic to have you with us.
      </p>
      <p>
        Here&apos;s what&apos;s next: To get your profile up and running,
        let&apos;s have a chat! Schedule a 45-minute meeting with us at{" "}
        <a href="https://calendly.com/benoit-kulesza/45-minutes-meeting">
          https://calendly.com/benoit-kulesza/45-minutes-meeting
        </a>{" "}
        – can&apos;t wait to hear your ideas and plans.
      </p>
      <p>
        And hey, got friends who&apos;d love to be a part of this too? Share
        your unique referral link with them! 🌍 For every mission your referrals
        complete with customer satisfaction, you earn a cool 5% slice of the
        platform fee. It&apos;s our way of saying thanks for spreading the word
        and growing our community.
      </p>
      <p>
        Looking forward to our chat and seeing you bring your A-game to
        GoodHive. Let&apos;s make something awesome together!
      </p>
      <br />
      <p>All the best,</p>
      <p>The GoodHive Core Team 🐝</p>
    </div>
  );
};

export default TalentRegistrationTemplate;
