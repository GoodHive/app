import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { EmailAuthFlow } from '@/app/components/ThirdwebConnect/EmailAuthFlow';
import userEvent from '@testing-library/user-event';

describe('EmailAuthFlow', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email input step initially', () => {
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    expect(screen.getByText('🍯 Connect with Email')).toBeInTheDocument();
    expect(screen.getByText('Enter your email to create or access your hive wallet')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Continue with Email 🐝')).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');

    // Test invalid email
    await user.type(emailInput, 'invalid-email');
    fireEvent.click(continueButton);

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();

    // Test valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    
    expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
  });

  it('should progress to verification step with valid email', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');

    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
      expect(screen.getByText('We sent a verification code to test@example.com')).toBeInTheDocument();
    });
  });

  it('should handle OTP input in verification step', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    // Test OTP input
    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs).toHaveLength(6); // 6 digit OTP

    // Type in first input
    await user.type(otpInputs[0], '1');
    expect(otpInputs[0]).toHaveValue('1');
  });

  it('should auto-focus next OTP input after entering digit', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');
    
    // Type in first input - should focus second
    await user.type(otpInputs[0], '1');
    expect(document.activeElement).toBe(otpInputs[1]);
  });

  it('should handle backspace in OTP inputs', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');
    
    // Type in first two inputs
    await user.type(otpInputs[0], '1');
    await user.type(otpInputs[1], '2');
    
    // Press backspace in second input
    fireEvent.keyDown(otpInputs[1], { key: 'Backspace' });
    
    // Should focus previous input
    expect(document.activeElement).toBe(otpInputs[0]);
  });

  it('should handle resend verification code', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    const resendButton = screen.getByText('Resend Code');
    fireEvent.click(resendButton);

    expect(screen.getByText('Verification code resent!')).toBeInTheDocument();
  });

  it('should handle successful verification', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    // Fill in complete OTP
    const otpInputs = screen.getAllByRole('textbox');
    await user.type(otpInputs[0], '1');
    await user.type(otpInputs[1], '2');
    await user.type(otpInputs[2], '3');
    await user.type(otpInputs[3], '4');
    await user.type(otpInputs[4], '5');
    await user.type(otpInputs[5], '6');

    const verifyButton = screen.getByText('Verify & Connect 🚀');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        email: 'test@example.com',
        verified: true,
      });
    });
  });

  it('should handle verification error', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    // Fill in invalid OTP
    const otpInputs = screen.getAllByRole('textbox');
    await user.type(otpInputs[0], '0');
    await user.type(otpInputs[1], '0');
    await user.type(otpInputs[2], '0');
    await user.type(otpInputs[3], '0');
    await user.type(otpInputs[4], '0');
    await user.type(otpInputs[5], '0');

    const verifyButton = screen.getByText('Verify & Connect 🚀');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code. Please try again.')).toBeInTheDocument();
    });
  });

  it('should allow going back to email step', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    const backButton = screen.getByText('← Change Email');
    fireEvent.click(backButton);

    expect(screen.getByText('🍯 Connect with Email')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('should show loading state during verification', async () => {
    const user = userEvent.setup();
    render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Get to verification step and fill OTP
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const continueButton = screen.getByText('Continue with Email 🐝');
    await user.type(emailInput, 'test@example.com');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('🔐 Verify Your Email')).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');
    await user.type(otpInputs[0], '1');
    await user.type(otpInputs[1], '2');
    await user.type(otpInputs[2], '3');
    await user.type(otpInputs[3], '4');
    await user.type(otpInputs[4], '5');
    await user.type(otpInputs[5], '6');

    const verifyButton = screen.getByText('Verify & Connect 🚀');
    fireEvent.click(verifyButton);

    expect(screen.getByText('🍯 Verifying...')).toBeInTheDocument();
  });

  it('should have honey bee themed styling', () => {
    const { container } = render(<EmailAuthFlow onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    // Check for honey bee themed colors in the container
    const authFlow = container.querySelector('[style*="background"]');
    expect(authFlow).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmailAuthFlow 
        onSuccess={mockOnSuccess} 
        onError={mockOnError} 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});