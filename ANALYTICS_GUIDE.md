# 🎯 GoodHive Analytics Tracking Guide

## Overview
Your platform now tracks comprehensive user behavior and campaign performance through dual analytics systems.

## 📊 Where to View Data

### 1. Vercel Analytics
- **URL**: Vercel Dashboard → goodhive-production → Analytics
- **Shows**: Page views, unique visitors, top pages, performance metrics
- **Updates**: Real-time
- **Best for**: Quick overview, performance monitoring

### 2. Google Analytics 4
- **URL**: https://analytics.google.com
- **Property ID**: G-LW6D4ME9JY
- **Shows**: Custom events, conversion funnels, campaign attribution
- **Updates**: ~24 hour delay for detailed reports
- **Best for**: Deep user behavior analysis, campaign ROI

## 🎯 Events Being Tracked

### User Journey Events
| Event Name | When It Fires | Data Captured |
|------------|---------------|---------------|
| `signup_started` | User visits signup page | Source (direct, referral, campaign) |
| `signup_completed` | Account created successfully | Method (email/wallet), source |
| `email_verification_sent` | OTP sent to email | Timestamp |
| `email_verified` | Email successfully verified | Timestamp |
| `profile_creation_started` | User begins profile form | User type (talent/company) |
| `profile_submitted_for_review` | Profile sent for approval | User type, completion status |

### Job Interaction Events
| Event Name | When It Fires | Data Captured |
|------------|---------------|---------------|
| `job_card_clicked` | Job card clicked in search | Job ID, title, company name |
| `job_details_viewed` | Job page opened | Job ID, title, source (search/direct) |
| `job_search_performed` | Search executed | Search term, filters applied |
| `job_application_started` | Apply button clicked | Job ID, title |

### Campaign Attribution Events
| Event Name | When It Fires | Data Captured |
|------------|---------------|---------------|
| `campaign_landing` | User arrives with UTM params | utm_source, utm_medium, utm_campaign |
| `referral_used` | User arrives with referral code | Referral code |
| `page_viewed` | Any page visited | Page name, user ID |
| `button_clicked` | Important buttons clicked | Button name, location |

### Error Tracking
| Event Name | When It Fires | Data Captured |
|------------|---------------|---------------|
| `error_occurred` | Any error happens | Error type, message, page |

## 🔍 How to View Specific Data in GA4

### View Custom Events
1. Go to **Reports** → **Engagement** → **Events**
2. Click on any event name to see details
3. Add **Event parameters** as secondary dimensions

### Create Conversion Funnel
1. Go to **Explore** → **Funnel exploration**
2. Add these steps:
   - `signup_started`
   - `signup_completed`
   - `profile_creation_started`
   - `profile_submitted_for_review`

### View Campaign Performance
1. Go to **Reports** → **Acquisition** → **Traffic acquisition**
2. Filter by campaign parameters
3. See which campaigns drive most signups

### Track Job Engagement
1. Go to **Reports** → **Engagement** → **Events**
2. Filter by `job_*` events
3. See most popular jobs and companies

## 🧪 Testing Your Analytics (For Development)

### Browser Console Verification
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for: `"Event tracked: [event_name]"` messages
4. These confirm events are firing correctly

### Test UTM Tracking
Visit your site with UTM parameters:
```
http://localhost:3000/?utm_source=facebook&utm_medium=cpc&utm_campaign=winter2024
```

### Test Referral Tracking
Visit with referral code:
```
http://localhost:3000/?ref=ABC123
```

## 📈 Key Metrics to Monitor

### Campaign Success Metrics
- **Conversion Rate**: `signup_completed` / `signup_started`
- **Profile Completion Rate**: `profile_submitted_for_review` / `signup_completed`
- **Job Engagement**: `job_details_viewed` / `job_card_clicked`
- **Source Performance**: Compare conversion rates by utm_source

### User Experience Metrics
- **Error Rate**: `error_occurred` events frequency
- **Drop-off Points**: Where users leave the funnel
- **Popular Jobs**: Most clicked job cards
- **Search Behavior**: Most used search terms

## 🎯 Campaign Optimization Tips

### High-Performing Sources
- Identify utm_source with highest conversion rates
- Increase budget for best-performing channels
- A/B test ad creative for underperforming sources

### User Journey Optimization
- Find funnel drop-off points
- Optimize pages with high error rates
- Improve job descriptions for low-engagement jobs

### Referral Program Performance
- Track referral_used events
- Monitor referral-to-signup conversion
- Identify top referrers for rewards

## 🔧 Troubleshooting

### Events Not Showing in GA4
- Events take 24-48 hours to appear in reports
- Check browser console for "Event tracked:" messages
- Verify GA4 property ID is correct: G-LW6D4ME9JY

### Vercel Analytics Not Updating
- Data shows after deployment to production
- Local development events don't appear
- Check Vercel dashboard after pushing to main branch

### Missing UTM Data
- UTM parameters are stored in localStorage
- They persist across user sessions
- Clear localStorage to test new UTM parameters

## 📞 Need Help?
Check browser console for any error messages and verify all events are firing with "Event tracked:" logs.