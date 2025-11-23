import { track } from '@vercel/analytics';
import { gaEvent } from './ga';

// Event types for type safety
export interface EventData {
  [key: string]: string | number | boolean | undefined;
}

// Custom event tracking that works with both Vercel Analytics and Google Analytics
export const trackEvent = (eventName: string, data?: EventData) => {
  try {
    // Track with Vercel Analytics
    if (typeof window !== 'undefined') {
      track(eventName, data);
    }

    // Also track with Google Analytics for comprehensive coverage
    gaEvent(eventName, data);

    console.log('Event tracked:', eventName, data);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Campaign and user journey events
export const analytics = {
  // User registration events
  signupStarted: (source?: string) => {
    trackEvent('signup_started', {
      source: source || 'direct',
      timestamp: Date.now(),
    });
  },

  signupCompleted: (method: string, source?: string) => {
    trackEvent('signup_completed', {
      method, // 'email', 'wallet', etc.
      source: source || 'direct',
      timestamp: Date.now(),
    });
  },

  // Email verification
  emailVerificationSent: () => {
    trackEvent('email_verification_sent', {
      timestamp: Date.now(),
    });
  },

  emailVerified: () => {
    trackEvent('email_verified', {
      timestamp: Date.now(),
    });
  },

  // Profile completion events
  profileCreationStarted: (userType: string) => {
    trackEvent('profile_creation_started', {
      user_type: userType, // 'talent', 'company'
      timestamp: Date.now(),
    });
  },

  profileSaved: (userType: string, isComplete: boolean = false) => {
    trackEvent('profile_saved', {
      user_type: userType,
      is_complete: isComplete,
      timestamp: Date.now(),
    });
  },

  profileSubmittedForReview: (userType: string) => {
    trackEvent('profile_submitted_for_review', {
      user_type: userType,
      timestamp: Date.now(),
    });
  },

  // Job-related events
  jobSearchPerformed: (searchTerm?: string, filters?: string) => {
    trackEvent('job_search_performed', {
      search_term: searchTerm || '',
      filters: filters || '',
      timestamp: Date.now(),
    });
  },

  jobCardClicked: (jobId: string, jobTitle: string, companyName: string) => {
    trackEvent('job_card_clicked', {
      job_id: jobId,
      job_title: jobTitle,
      company_name: companyName,
      timestamp: Date.now(),
    });
  },

  jobDetailsViewed: (jobId: string, jobTitle: string, source: string = 'search') => {
    trackEvent('job_details_viewed', {
      job_id: jobId,
      job_title: jobTitle,
      source, // 'search', 'direct_link', etc.
      timestamp: Date.now(),
    });
  },

  jobApplicationStarted: (jobId: string, jobTitle: string) => {
    trackEvent('job_application_started', {
      job_id: jobId,
      job_title: jobTitle,
      timestamp: Date.now(),
    });
  },

  // Navigation and engagement
  pageViewed: (pageName: string, userId?: string) => {
    trackEvent('page_viewed', {
      page_name: pageName,
      user_id: userId || 'anonymous',
      timestamp: Date.now(),
    });
  },

  buttonClicked: (buttonName: string, location: string) => {
    trackEvent('button_clicked', {
      button_name: buttonName,
      location: location,
      timestamp: Date.now(),
    });
  },

  // Campaign tracking
  campaignLanding: (source: string, medium: string, campaign: string) => {
    trackEvent('campaign_landing', {
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      timestamp: Date.now(),
    });
  },

  referralUsed: (referralCode: string) => {
    trackEvent('referral_used', {
      referral_code: referralCode,
      timestamp: Date.now(),
    });
  },

  // Company-specific events
  jobPosted: (jobId: string, jobTitle: string, companyId: string) => {
    trackEvent('job_posted', {
      job_id: jobId,
      job_title: jobTitle,
      company_id: companyId,
      timestamp: Date.now(),
    });
  },

  talentContacted: (talentId: string, companyId: string, method: string) => {
    trackEvent('talent_contacted', {
      talent_id: talentId,
      company_id: companyId,
      method: method, // 'direct_message', 'job_offer', etc.
      timestamp: Date.now(),
    });
  },

  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string, page: string) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit message length
      page: page,
      timestamp: Date.now(),
    });
  },
};

// UTM parameter tracking utility
export const trackUTMParameters = () => {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const referralCode = urlParams.get('ref');

  if (utmSource || utmMedium || utmCampaign) {
    analytics.campaignLanding(
      utmSource || 'unknown',
      utmMedium || 'unknown',
      utmCampaign || 'unknown'
    );

    // Store UTM data in localStorage for attribution
    localStorage.setItem('utm_data', JSON.stringify({
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      timestamp: Date.now(),
    }));
  }

  if (referralCode) {
    analytics.referralUsed(referralCode);
    localStorage.setItem('referral_code', referralCode);
  }
};

// Helper to get stored campaign data
export const getCampaignData = () => {
  if (typeof window === 'undefined') return null;

  try {
    const utmData = localStorage.getItem('utm_data');
    const referralCode = localStorage.getItem('referral_code');

    return {
      utm: utmData ? JSON.parse(utmData) : null,
      referral: referralCode,
    };
  } catch (error) {
    console.error('Error getting campaign data:', error);
    return null;
  }
};