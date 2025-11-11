import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "GoodHive <noreply@goodhive.io>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("Email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<boolean> {
  const subject = "Verify Your Email - GoodHive";
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
          }
          .otp-box {
            background: #fef3c7;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #92400e;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .message {
            color: #666;
            margin: 20px 0;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 14px;
          }
          .warning {
            color: #dc2626;
            font-size: 14px;
            margin-top: 20px;
            padding: 15px;
            background: #fee2e2;
            border-radius: 6px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #f59e0b;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍯 GoodHive</h1>
          </div>
          <div class="content">
            <h2 style="color: #111; margin-bottom: 10px;">Verify Your Email Address</h2>
            <p class="message">
              Welcome to GoodHive! To complete your registration and secure your account, 
              please enter the verification code below:
            </p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your verification code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                This code will expire in 10 minutes
              </p>
            </div>
            
            <p class="message">
              Enter this code in the verification screen to confirm your email address 
              and complete your account setup.
            </p>
            
            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. 
              GoodHive staff will never ask for your verification code.
            </div>
          </div>
          <div class="footer">
            <p>
              If you didn't request this verification, please ignore this email.
              <br>
              © ${new Date().getFullYear()} GoodHive. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    GoodHive - Verify Your Email Address
    
    Welcome to GoodHive! To complete your registration, please use the verification code below:
    
    Verification Code: ${otp}
    
    This code will expire in 10 minutes.
    
    If you didn't request this verification, please ignore this email.
    
    © ${new Date().getFullYear()} GoodHive. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  isNewUser: boolean = true
): Promise<boolean> {
  const subject = isNewUser 
    ? "Welcome to GoodHive! 🍯" 
    : "Welcome Back to GoodHive!";
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GoodHive</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: #f59e0b;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .feature {
            display: flex;
            align-items: center;
            margin: 20px 0;
          }
          .feature-icon {
            width: 48px;
            height: 48px;
            background: #fef3c7;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            font-size: 24px;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍯 Welcome to GoodHive!</h1>
          </div>
          <div class="content">
            <h2 style="color: #111; margin-bottom: 10px;">
              ${isNewUser ? "Your account is ready!" : "Great to see you back!"}
            </h2>
            <p style="color: #666; margin: 20px 0;">
              ${isNewUser 
                ? "Thank you for verifying your email. Your GoodHive account is now fully activated and ready to use."
                : "Your email has been successfully linked to your wallet account. You now have full access to all GoodHive features."}
            </p>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #111;">What you can do now:</h3>
              
              <div class="feature">
                <div class="feature-icon">💼</div>
                <div>
                  <strong>Find Your Dream Job</strong><br>
                  <span style="color: #666;">Browse thousands of opportunities in Web3</span>
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🌟</div>
                <div>
                  <strong>Showcase Your Talent</strong><br>
                  <span style="color: #666;">Create a profile that stands out to recruiters</span>
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🤝</div>
                <div>
                  <strong>Connect & Grow</strong><br>
                  <span style="color: #666;">Network with professionals in the blockchain space</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://goodhive.io"}/talents/my-profile" class="button">
                Go to Your Profile
              </a>
            </div>
          </div>
          <div class="footer">
            <p>
              Need help? Contact us at support@goodhive.io
              <br><br>
              © ${new Date().getFullYear()} GoodHive. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to GoodHive!
    
    ${isNewUser 
      ? "Your account is ready! Thank you for verifying your email."
      : "Welcome back! Your email has been successfully linked to your wallet account."}
    
    What you can do now:
    - Find Your Dream Job: Browse thousands of opportunities in Web3
    - Showcase Your Talent: Create a profile that stands out
    - Connect & Grow: Network with blockchain professionals
    
    Visit your profile: ${process.env.NEXT_PUBLIC_APP_URL || "https://goodhive.io"}/talents/my-profile
    
    Need help? Contact us at support@goodhive.io
    
    © ${new Date().getFullYear()} GoodHive. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}