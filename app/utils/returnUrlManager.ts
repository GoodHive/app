"use client";

export interface AuthContext {
  returnUrl?: string;
  isManualConnection: boolean;
  intendedAction?: 'contact' | 'access-protected' | 'service-action';
  postAuthAction?: {
    type: 'show-contact-modal' | 'redirect';
    data?: any;
  };
}

const AUTH_CONTEXT_KEY = 'goodhive_auth_context';

export class ReturnUrlManager {
  /**
   * Store authentication context in sessionStorage
   */
  static setAuthContext(context: AuthContext): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(AUTH_CONTEXT_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('Failed to store auth context:', error);
    }
  }

  /**
   * Get authentication context from sessionStorage
   */
  static getAuthContext(): AuthContext | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = sessionStorage.getItem(AUTH_CONTEXT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get auth context:', error);
      return null;
    }
  }

  /**
   * Clear authentication context from sessionStorage
   */
  static clearAuthContext(): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(AUTH_CONTEXT_KEY);
    } catch (error) {
      console.error('Failed to clear auth context:', error);
    }
  }

  /**
   * Set context for manual wallet connection (should go to profile)
   */
  static setManualConnection(): void {
    this.setAuthContext({
      isManualConnection: true,
    });
  }

  /**
   * Set context for prompted authentication with return URL
   */
  static setPromptedAuth(
    returnUrl: string,
    intendedAction: AuthContext['intendedAction'],
    postAuthAction?: AuthContext['postAuthAction']
  ): void {
    this.setAuthContext({
      returnUrl,
      isManualConnection: false,
      intendedAction,
      postAuthAction,
    });
  }

  /**
   * Set context for contact action
   */
  static setContactAction(currentUrl: string, companyData?: any): void {
    this.setPromptedAuth(
      currentUrl,
      'contact',
      {
        type: 'show-contact-modal',
        data: companyData,
      }
    );
  }

  /**
   * Set context for protected route access
   */
  static setProtectedRouteAccess(protectedUrl: string): void {
    console.log('ReturnUrlManager: Setting protected route access for:', protectedUrl);
    this.setPromptedAuth(protectedUrl, 'access-protected');
  }

  /**
   * Set context for service action
   */
  static setServiceAction(currentUrl: string, serviceType: string): void {
    this.setPromptedAuth(
      currentUrl,
      'service-action',
      {
        type: 'redirect',
        data: { serviceType },
      }
    );
  }

  /**
   * Get the URL to redirect to after authentication
   */
  static getRedirectUrl(): string | null {
    const context = this.getAuthContext();

    console.log('ReturnUrlManager: getRedirectUrl - context:', context);

    if (!context) return null;

    // Manual connection should go to profile
    if (context.isManualConnection) {
      return '/talents/my-profile';
    }

    // Prompted auth should return to intended URL
    console.log('ReturnUrlManager: Returning URL:', context.returnUrl);
    return context.returnUrl || null;
  }

  /**
   * Get post-authentication action to perform
   */
  static getPostAuthAction(): AuthContext['postAuthAction'] | null {
    const context = this.getAuthContext();
    return context?.postAuthAction || null;
  }

  /**
   * Check if current authentication is manual
   */
  static isManualConnection(): boolean {
    const context = this.getAuthContext();
    return context?.isManualConnection || false;
  }
}