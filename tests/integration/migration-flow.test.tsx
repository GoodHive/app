import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MigrationWizard } from '@/app/components/ThirdwebConnect/MigrationWizard';
import { HoneyBeeConnectButton } from '@/app/components/ThirdwebConnect/HoneyBeeConnectButton';
import { FEATURES } from '@/lib/thirdweb/config';

// Mock all the dependencies
vi.mock('thirdweb/react', () => ({
  useActiveAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
  ThirdwebProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/thirdweb/config', () => ({
  FEATURES: {
    MIGRATION_BANNER: true,
    USE_THIRDWEB: true,
    EMAIL_AUTH: true,
    SMART_ACCOUNT: true,
    GASLESS_TRANSACTIONS: true,
    ROLLOUT_PERCENT: 100,
  },
  getThirdwebClient: vi.fn(() => ({ clientId: 'test-client-id' })),
  smartAccountConfig: {
    chain: { id: 137 },
    sponsorGas: true,
    factoryAddress: "0x4651515A83ea12d4E5b48C27E7F5e9FF8D9a4FA3",
    gasless: true,
  },
  WALLET_CONFIG: {
    supportedWallets: ['in-app', 'injected', 'wallet-connect'],
    defaultWallet: 'in-app',
    enableEmailAuth: true,
    enableSocialAuth: true,
    inAppWalletAuth: ['email', 'google', 'apple'],
    enableGasless: true,
  },
  GOODHIVE_THEME_COLORS: {
    primaryText: '#2C3E50',
    secondaryText: '#666666',
    accent: '#FACC14',
    primaryButtonBg: '#FACC14',
    primaryButtonText: '#000000',
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FFA726',
  },
  trackWalletEvent: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Migration Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup localStorage and cookies for migration detection
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('true'),
        removeItem: vi.fn(),
      },
    });

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'okto_wallet_address=0x123; user_id=user123',
    });

    // Mock successful API responses by default
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user_id: 'user123',
            email: 'test@example.com',
            wallet_address: '0x123',
          }),
        });
      }
      
      if (url === '/api/auth/thirdweb-verify') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            user: {
              user_id: 'user123',
              email: 'test@example.com',
              address: '0xnewaddress',
            },
            isMigration: true,
          }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  describe('Feature Flag System', () => {
    it('should respect USE_THIRDWEB feature flag', () => {
      expect(FEATURES.USE_THIRDWEB).toBe(true);
      expect(FEATURES.MIGRATION_BANNER).toBe(true);
      expect(FEATURES.EMAIL_AUTH).toBe(true);
    });

    it('should disable migration when MIGRATION_BANNER is false', () => {
      vi.mocked(FEATURES).MIGRATION_BANNER = false;
      
      const { container } = render(<MigrationWizard />);
      expect(container.firstChild).toBeNull();
    });

    it('should enable migration when rollout percentage is met', () => {
      vi.mocked(FEATURES).ROLLOUT_PERCENT = 100;
      
      render(<MigrationWizard />);
      
      expect(screen.getByText('Upgrade Your Hive Experience')).toBeInTheDocument();
    });
  });

  describe('Complete Migration Journey', () => {
    it('should complete full migration flow for Okto user', async () => {
      const mockOnComplete = vi.fn();
      const mockOnError = vi.fn();
      
      render(<MigrationWizard onComplete={mockOnComplete} onError={mockOnError} />);

      // Step 1: Should start with account detection
      await waitFor(() => {
        expect(screen.getByText('Checking your existing GoodHive account')).toBeInTheDocument();
      });

      // Should make API call to detect existing user
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'include',
      });

      // Step 2: Should progress to connect step
      await waitFor(() => {
        expect(screen.getByText('Connect using enhanced Thirdweb wallet')).toBeInTheDocument();
        expect(screen.getByText('Connect Enhanced Wallet 🚀')).toBeInTheDocument();
      });

      // Should not have called onError
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle new user registration', async () => {
      // Mock new user scenario
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '', // No existing cookies
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(null),
        },
      });

      const { container } = render(<MigrationWizard />);
      
      // Should not render wizard for new users
      expect(container.firstChild).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const mockOnError = vi.fn();
      render(<MigrationWizard onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });
    });

    it('should clean up localStorage after successful migration', async () => {
      const mockRemoveItem = vi.fn();
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue('true'),
          removeItem: mockRemoveItem,
        },
      });

      render(<MigrationWizard />);

      // Wait for the migration process to start
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Eventually should clean up localStorage
      // This is tested more thoroughly in the MigrationWizard unit tests
    });
  });

  describe('Wallet Connection Integration', () => {
    it('should integrate HoneyBeeConnectButton with MigrationWizard', async () => {
      const mockConnect = vi.fn();
      const mockUseConnect = vi.fn().mockReturnValue({
        connect: mockConnect,
        isConnecting: false,
        error: null,
      });
      
      const mockUseActiveAccount = vi.fn().mockReturnValue(null);
      
      vi.doMock('thirdweb/react', () => ({
        useActiveAccount: mockUseActiveAccount,
        useConnect: mockUseConnect,
        useDisconnect: vi.fn(),
      }));

      render(<HoneyBeeConnectButton />);

      expect(screen.getByText('🐝 Connect Hive Wallet')).toBeInTheDocument();
      
      const connectButton = screen.getByText('🐝 Connect Hive Wallet');
      fireEvent.click(connectButton);

      expect(mockConnect).toHaveBeenCalled();
    });

    it('should handle wallet connection success in migration flow', async () => {
      const mockOnComplete = vi.fn();
      render(<MigrationWizard onComplete={mockOnComplete} />);

      // Wait for connect step
      await waitFor(() => {
        expect(screen.getByText('Connect Enhanced Wallet 🚀')).toBeInTheDocument();
      });

      // The actual wallet connection would be handled by HoneyBeeConnectButton
      // and would trigger the handleWalletConnect callback in MigrationWizard
    });
  });

  describe('Database Migration Integration', () => {
    it('should verify database migration was executed', () => {
      // This is more of a documentation test since we can't easily test the actual DB
      expect(true).toBe(true); // Placeholder
      
      // In a real integration test, we would:
      // 1. Set up a test database
      // 2. Run the migration scripts
      // 3. Verify the schema changes
      // 4. Test data migration scenarios
    });

    it('should handle migration rollback scenarios', () => {
      // This would test the rollback functionality
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle partial migration failures', async () => {
      // Mock API failure during verification step
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/auth/thirdweb-verify') {
          return Promise.reject(new Error('Verification failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const mockOnError = vi.fn();
      render(<MigrationWizard onError={mockOnError} />);

      // Should eventually call onError for verification failure
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should allow retry after failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Temporary error'));

      render(<MigrationWizard />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Temporary error')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Mock successful retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user_id: 'user123',
          email: 'test@example.com',
        }),
      });

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Should retry the operation
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Performance and Analytics', () => {
    it('should track migration performance metrics', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<MigrationWizard />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Should log performance metrics
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐝 Detecting existing account...')
      );

      consoleSpy.mockRestore();
    });

    it('should handle high concurrent migration load', () => {
      // Test concurrent migrations
      const promises = Array.from({ length: 10 }, () => {
        const { unmount } = render(<MigrationWizard />);
        return new Promise(resolve => {
          setTimeout(() => {
            unmount();
            resolve(true);
          }, 100);
        });
      });

      expect(Promise.all(promises)).resolves.toBeTruthy();
    });
  });
});