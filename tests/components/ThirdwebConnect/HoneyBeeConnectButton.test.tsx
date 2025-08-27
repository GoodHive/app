import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HoneyBeeConnectButton } from '@/app/components/ThirdwebConnect/HoneyBeeConnectButton';
import { useActiveAccount, useConnect, useDisconnect } from 'thirdweb/react';

// Mock the Thirdweb hooks
vi.mock('thirdweb/react', () => ({
  useActiveAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
  ThirdwebProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('HoneyBeeConnectButton', () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockOnConnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useConnect as any).mockReturnValue({
      connect: mockConnect,
      isConnecting: false,
      error: null,
    });

    (useDisconnect as any).mockReturnValue({
      disconnect: mockDisconnect,
    });
  });

  it('should render connect button when no account is connected', () => {
    (useActiveAccount as any).mockReturnValue(null);

    render(<HoneyBeeConnectButton />);

    expect(screen.getByText('🐝 Connect Hive Wallet')).toBeInTheDocument();
    expect(screen.getByText('Choose from 500+ wallets or create with email')).toBeInTheDocument();
  });

  it('should render disconnect button when account is connected', () => {
    const mockAccount = {
      address: '0x123...abc',
    };
    (useActiveAccount as any).mockReturnValue(mockAccount);

    render(<HoneyBeeConnectButton />);

    expect(screen.getByText('🐝 0x123...abc')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('should show loading state when connecting', () => {
    (useActiveAccount as any).mockReturnValue(null);
    (useConnect as any).mockReturnValue({
      connect: mockConnect,
      isConnecting: true,
      error: null,
    });

    render(<HoneyBeeConnectButton />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should display error message when connection fails', () => {
    (useActiveAccount as any).mockReturnValue(null);
    (useConnect as any).mockReturnValue({
      connect: mockConnect,
      isConnecting: false,
      error: new Error('Connection failed'),
    });

    render(<HoneyBeeConnectButton />);

    expect(screen.getByText('Connection failed. Please try again.')).toBeInTheDocument();
  });

  it('should call onConnect callback when wallet connects successfully', async () => {
    (useActiveAccount as any).mockReturnValue(null);

    render(<HoneyBeeConnectButton onConnect={mockOnConnect} />);

    const connectButton = screen.getByText('🐝 Connect Hive Wallet');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it('should call disconnect when disconnect button is clicked', async () => {
    const mockAccount = {
      address: '0x123...abc',
    };
    (useActiveAccount as any).mockReturnValue(mockAccount);

    render(<HoneyBeeConnectButton />);

    const disconnectButton = screen.getByText('Disconnect');
    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  it('should render with custom label', () => {
    (useActiveAccount as any).mockReturnValue(null);

    render(<HoneyBeeConnectButton label="Custom Connect Label" />);

    expect(screen.getByText('Custom Connect Label')).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    (useActiveAccount as any).mockReturnValue(null);

    const { container } = render(<HoneyBeeConnectButton size="sm" />);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('should apply large size classes correctly', () => {
    (useActiveAccount as any).mockReturnValue(null);

    const { container } = render(<HoneyBeeConnectButton size="lg" />);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('should have honey bee themed styling', () => {
    (useActiveAccount as any).mockReturnValue(null);

    const { container } = render(<HoneyBeeConnectButton />);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass(
      'bg-gradient-to-r',
      'from-yellow-400',
      'to-amber-500',
      'hover:from-yellow-500',
      'hover:to-amber-600'
    );
  });
});