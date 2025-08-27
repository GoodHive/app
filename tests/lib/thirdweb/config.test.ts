import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getThirdwebClient, FEATURES, WALLET_CONFIG } from '@/lib/thirdweb/config';

// Mock the thirdweb client creation
vi.mock('thirdweb', () => ({
  createThirdwebClient: vi.fn(() => ({ clientId: 'test-client-id' })),
}));

describe('Thirdweb Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getThirdwebClient', () => {
    it('should create and return a Thirdweb client', () => {
      const client = getThirdwebClient();
      
      expect(client).toBeDefined();
      expect(client.clientId).toBe('test-client-id');
    });

    it('should return the same client instance on subsequent calls (singleton)', () => {
      const client1 = getThirdwebClient();
      const client2 = getThirdwebClient();
      
      expect(client1).toBe(client2);
    });
  });

  describe('FEATURES configuration', () => {
    it('should have correct feature flags', () => {
      expect(FEATURES).toEqual({
        USE_THIRDWEB: true,
        MIGRATION_BANNER: true,
        EMAIL_AUTH: true,
        SMART_ACCOUNT: true,
        GASLESS_TRANSACTIONS: true,
        ROLLOUT_PERCENT: 100,
      });
    });

    it('should use environment variables for configuration', () => {
      expect(FEATURES.USE_THIRDWEB).toBe(true);
      expect(FEATURES.ROLLOUT_PERCENT).toBe(100);
    });
  });

  describe('WALLET_CONFIG', () => {
    it('should have correct wallet configuration', () => {
      expect(WALLET_CONFIG).toEqual({
        supportedWallets: ['in-app', 'injected', 'wallet-connect'],
        defaultWallet: 'in-app',
        enableEmailAuth: true,
        enableSocialAuth: true,
        enableGasless: true,
      });
    });
  });
});