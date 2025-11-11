import * as React from "react";

interface ContactUsTemplateProps {
  name: string;
  email: string;
  message: string;
}

export default function ContactUsTemplate({ name, email, message }: ContactUsTemplateProps) {
  return (
    <div style={main}>
      <div style={container}>
        {/* Header */}
        <div style={header}>
          <img
            src="https://goodhive.io/img/goodhive_logo.png"
            alt="GoodHive Logo"
            style={logo}
          />
        </div>
        
        {/* Content */}
        <div style={content}>
          <h1 style={heading}>🍯 New GoodHive Inquiry Received!</h1>
          
          <p style={paragraph}>
            Buzzing news! You have received a new contact message from the GoodHive website:
          </p>
          
          {/* Message Box */}
          <div style={messageBox}>
            <p style={label}><strong>👤 From:</strong></p>
            <p style={value}>{name}</p>
            
            <p style={label}><strong>📧 Email:</strong></p>
            <p style={value}>{email}</p>
            
            <p style={label}><strong>💬 Message:</strong></p>
            <div style={messageText}>{message}</div>
          </div>
          
          <hr style={hr} />
          
          <p style={footer}>
            This message was sent from the Contact Us form on the GoodHive website.
            <br />
            Please reply directly to <a href={`mailto:${email}`} style={emailLink}>{email}</a> to respond to this inquiry.
          </p>
          
          {/* Signature */}
          <div style={signature}>
            <p style={signatureText}>🐝 GoodHive Team</p>
            <p style={signatureSubtext}>Connecting Talent in the Web3 Ecosystem</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const header = {
  backgroundColor: '#f59e0b',
  borderRadius: '12px 12px 0 0',
  padding: '24px',
  textAlign: 'center' as const,
};

const logo = {
  height: '60px',
  margin: '0 auto',
};

const content = {
  backgroundColor: '#ffffff',
  border: '1px solid #f3f4f6',
  borderRadius: '0 0 12px 12px',
  padding: '32px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 24px 0',
};

const messageBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const label = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0 0 4px 0',
};

const value = {
  fontSize: '16px',
  color: '#111827',
  margin: '0 0 16px 0',
  fontWeight: '500',
};

const messageText = {
  fontSize: '16px',
  color: '#111827',
  margin: '0',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const emailLink = {
  color: '#f59e0b',
  textDecoration: 'underline',
};

const signature = {
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
  margin: '24px 0 0 0',
};

const signatureText = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#f59e0b',
  margin: '0 0 8px 0',
};

const signatureSubtext = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};
