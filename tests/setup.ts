import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

// Set environment variables before imports
process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID = "4cbd356d64bab5853980d03c39c0a10b";
process.env.NEXT_PUBLIC_USE_THIRDWEB = "true";
process.env.NEXT_PUBLIC_ROLLOUT_PERCENT = "100";
process.env.DATABASE_URL = "postgres://web3jobfair:CEkD47YbJGIH@ep-throbbing-sound-a586nmwa.us-east-2.aws.neon.tech/goodhive-new-user";
process.env.JWT_SECRET = "dd6502f88edb5d3446a334548477d5fe6e68d45572778bce3ff14956d50834d454c4378f32aad777c876c50e3649cfca69c08e925f0bf90219381bc8e8b3e1b5";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
  }),
}));

// Mock Thirdweb modules
vi.mock("thirdweb/react", () => ({
  ThirdwebProvider: ({ children }: { children: React.ReactNode }) => children,
  ConnectButton: vi.fn(() => "ConnectButton"),
  useActiveAccount: () => null,
  useConnect: () => ({
    connect: vi.fn(),
    isConnecting: false,
    error: null,
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
  lightTheme: vi.fn(() => ({})),
  darkTheme: vi.fn(() => ({})),
}));

vi.mock("thirdweb", () => ({
  createThirdwebClient: vi.fn(() => ({ clientId: "test-client-id" })),
  defineChain: vi.fn(),
}));

vi.mock("thirdweb/wallets", () => ({
  inAppWallet: vi.fn(),
  createWallet: vi.fn(),
}));

vi.mock("thirdweb/utils", () => ({
  verifyMessage: vi.fn().mockResolvedValue(true),
}));

// Mock database connection
vi.mock("postgres", () => {
  const mockSql = vi.fn();
  mockSql.begin = vi.fn().mockResolvedValue(mockSql);
  mockSql.end = vi.fn().mockResolvedValue(undefined);
  mockSql.unsafe = vi.fn().mockResolvedValue([]);
  return { default: vi.fn(() => mockSql) };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

// Mock fetch for API calls
global.fetch = vi.fn();

beforeAll(() => {
  // Setup any global test configuration
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});
