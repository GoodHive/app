import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/auth/thirdweb-verify/route';
import { verifyMessage } from 'thirdweb/utils';
import { cookies } from 'next/headers';

// Mock the dependencies
vi.mock('thirdweb/utils', () => ({
  verifyMessage: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    set: vi.fn(),
  }),
}));

vi.mock('postgres', () => {
  const mockSql = vi.fn().mockImplementation((query, ...args) => {
    // Return different responses based on query patterns
    if (query.toString().includes('SELECT * FROM goodhive.users')) {
      if (args[0] === 'new_address') {
        return []; // New user
      } else if (args[0] === 'existing_okto_address') {
        return [{ 
          userid: 'user123',
          okto_wallet_address: 'existing_okto_address',
          thirdweb_wallet_address: null,
          email: 'test@example.com'
        }]; // Okto migration user
      } else {
        return [{ 
          userid: 'user456',
          thirdweb_wallet_address: 'existing_thirdweb_address',
          email: 'existing@example.com'
        }]; // Existing Thirdweb user
      }
    }
    
    if (query.toString().includes('INSERT INTO goodhive.users')) {
      return [{ 
        userid: 'new_user123',
        thirdweb_wallet_address: args[0],
        email: args[2]
      }];
    }
    
    if (query.toString().includes('UPDATE goodhive.users')) {
      return [{ 
        userid: 'user123',
        thirdweb_wallet_address: args[0],
        email: 'test@example.com'
      }];
    }
    
    return [];
  });
  
  mockSql.begin = vi.fn().mockImplementation(async (callback) => {
    return callback(mockSql);
  });
  
  return vi.fn(() => mockSql);
});

vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  })),
}));

describe('/api/auth/thirdweb-verify', () => {
  const mockCookiesSet = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as any).mockReturnValue({ set: mockCookiesSet });
  });

  it('should create a new user with Thirdweb wallet', async () => {
    const requestBody = {
      address: 'new_address',
      email: 'newuser@example.com',
      authProvider: 'google',
      authMethod: 'in-app',
      walletType: 'in-app',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.address).toBe('new_address');
    expect(data.user.email).toBe('newuser@example.com');
    expect(data.isNewUser).toBe(true);
    expect(data.isMigration).toBe(false);

    // Verify cookies were set
    expect(mockCookiesSet).toHaveBeenCalledWith(
      'session_token',
      'mock-jwt-token',
      expect.any(Object)
    );
  });

  it('should migrate an existing Okto user to Thirdweb', async () => {
    const requestBody = {
      address: 'new_thirdweb_address',
      email: 'test@example.com',
      authProvider: 'google',
      authMethod: 'in-app',
      walletType: 'in-app',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent',
      },
    });

    // Mock the database to return an existing Okto user
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isMigration).toBe(true);
    expect(data.user.address).toBe('new_thirdweb_address');
  });

  it('should update an existing Thirdweb user', async () => {
    const requestBody = {
      address: 'existing_thirdweb_address',
      authProvider: 'google',
      authMethod: 'in-app',
      walletType: 'in-app',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isNewUser).toBe(false);
    expect(data.isMigration).toBe(false);
  });

  it('should verify signature for external wallets', async () => {
    (verifyMessage as any).mockResolvedValue(true);

    const requestBody = {
      address: 'external_wallet_address',
      authProvider: 'metamask',
      authMethod: 'external',
      walletType: 'external',
      message: 'Sign this message',
      signature: '0xsignature...',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(verifyMessage).toHaveBeenCalledWith({
      message: 'Sign this message',
      signature: '0xsignature...',
      address: 'external_wallet_address',
    });

    expect(response.status).toBe(200);
  });

  it('should reject invalid signature for external wallets', async () => {
    (verifyMessage as any).mockResolvedValue(false);

    const requestBody = {
      address: 'external_wallet_address',
      authProvider: 'metamask',
      authMethod: 'external',
      walletType: 'external',
      message: 'Sign this message',
      signature: 'invalid_signature',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('should return 400 for missing required fields', async () => {
    const requestBody = {
      // Missing address
      authProvider: 'google',
      authMethod: 'in-app',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBe('Wallet address is required');
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    vi.mocked(vi.importActual('postgres')).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const requestBody = {
      address: 'test_address',
      authProvider: 'google',
      authMethod: 'in-app',
      walletType: 'in-app',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Verification failed');
  });

  it('should set smart account cookie when provided', async () => {
    const requestBody = {
      address: 'new_address',
      smartAccount: '0xsmartaccount123',
      authProvider: 'google',
      authMethod: 'in-app',
      walletType: 'in-app',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/thirdweb-verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    await POST(request);

    expect(mockCookiesSet).toHaveBeenCalledWith(
      'smart_account',
      '0xsmartaccount123',
      expect.any(Object)
    );
  });
});