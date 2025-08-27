import Image from "next/image";

interface ContactUsConfirmationTemplateProps {
  name: string;
  email: string;
  message: string;
}

export default function ContactUsConfirmationTemplate({
  name,
  email,
  message,
}: ContactUsConfirmationTemplateProps) {
  return (
    <div style={main}>
      <div style={container}>
        {/* Header */}
        <div style={header}>
          <Image
            src="https://goodhive.io/img/goodhive_logo.png"
            alt="GoodHive Logo"
            width={200}
            height={60}
            style={logo}
          />
        </div>

        {/* Content */}
        <div style={content}>
          <h1 style={heading}>🍯 Thank You for Reaching Out!</h1>

          <p style={paragraph}>
            Hi <strong>{name}</strong>, thank you for contacting GoodHive! We've
            received your message and will get back to you soon.
          </p>

          {/* Message Box */}
          <div style={messageBox}>
            <h3 style={messageTitle}>📝 Your Message:</h3>
            <div style={messageText}>{message}</div>
          </div>

          <hr style={hr} />

          <div style={infoBox}>
            <h3 style={infoTitle}>📋 Message Details:</h3>
            <p style={infoText}>
              <strong>From:</strong> {name}
            </p>
            <p style={infoText}>
              <strong>Email:</strong> {email}
            </p>
            <p style={infoText}>
              <strong>Sent:</strong> {new Date().toLocaleString()}
            </p>
          </div>

          <hr style={hr} />

          <p style={footer}>
            <strong>What happens next?</strong>
            <br />
            Our team will review your message and respond within 24 hours. If
            you have any urgent questions, feel free to reach out to us directly
            at{" "}
            <a href="mailto:contact@goodhive.io" style={emailLink}>
              contact@goodhive.io
            </a>
          </p>

          {/* Signature */}
          <div style={signature}>
            <p style={signatureText}>🐝 GoodHive Team</p>
            <p style={signatureSubtext}>
              Connecting Talent in the Web3 Ecosystem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "580px",
};

const header = {
  backgroundColor: "#f59e0b",
  borderRadius: "12px 12px 0 0",
  padding: "24px",
  textAlign: "center" as const,
};

const logo = {
  height: "60px",
  margin: "0 auto",
};

const content = {
  backgroundColor: "#ffffff",
  border: "1px solid #f3f4f6",
  borderRadius: "0 0 12px 12px",
  padding: "32px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#111827",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 24px 0",
};

const messageBox = {
  backgroundColor: "#fef3c7",
  border: "2px solid #f59e0b",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const messageTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#92400e",
  margin: "0 0 16px 0",
};

const messageText = {
  fontSize: "16px",
  color: "#111827",
  margin: "0",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap" as const,
  backgroundColor: "#ffffff",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const infoBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const infoTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#374151",
  margin: "0 0 12px 0",
};

const infoText = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 8px 0",
  lineHeight: "1.5",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const emailLink = {
  color: "#f59e0b",
  textDecoration: "underline",
};

const signature = {
  textAlign: "center" as const,
  borderTop: "1px solid #e5e7eb",
  paddingTop: "24px",
  margin: "24px 0 0 0",
};

const signatureText = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#f59e0b",
  margin: "0 0 8px 0",
};

const signatureSubtext = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};
