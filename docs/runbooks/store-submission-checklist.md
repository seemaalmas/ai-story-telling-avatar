# App Store & Play Store Submission Checklist

## Apple App Store

### Pre-submission
- [ ] Bundle ID: `com.katha.ai`
- [ ] App Store Connect account set up with paid agreement
- [ ] EAS Build profile configured for production
- [ ] App icons: 1024x1024 (no alpha, no rounded corners)
- [ ] Screenshots: 6.7" (iPhone 15 Pro Max), 6.5" (iPhone 14 Plus), 5.5" (iPhone 8 Plus)
- [ ] iPad screenshots NOT needed (supportsTablet: false)
- [ ] App preview video (optional, recommended for story playback)

### Privacy & Compliance
- [ ] Privacy Policy URL hosted and accessible
- [ ] App Privacy Details filled in App Store Connect:
  - Data collected: email, name, usage data, diagnostics
  - Data linked to user: email, name
  - Data used for tracking: None
- [ ] Data deletion mechanism: DELETE /users/me endpoint functional
- [ ] Age rating: 4+ (family safe content, moderated)
- [ ] COPPA: Not directed at children under 13 (or implement COPPA compliance if targeting kids)

### In-App Purchases
- [ ] Products created in App Store Connect:
  - `com.katha.ai.premium.monthly` (Auto-Renewable, ₹149/mo)
  - `com.katha.ai.premium.yearly` (Auto-Renewable, ₹999/yr)
  - `com.katha.ai.family.monthly` (Auto-Renewable, ₹249/mo)
- [ ] Subscription group: "Katha Premium"
- [ ] Offer codes configured (optional)
- [ ] Free trial configured (if TRIAL_DAYS > 0)
- [ ] Server-to-Server notifications URL configured
- [ ] Receipt validation tested with sandbox accounts

### Apple Sign-In
- [ ] Sign in with Apple capability added in Xcode
- [ ] Service ID configured in Apple Developer Portal
- [ ] Private key generated and APPLE_PRIVATE_KEY set

### Review Guidelines
- [ ] No placeholder text or "Coming Soon" features visible
- [ ] AI-generated content clearly labeled (SyntheticLabel component)
- [ ] All external links (Privacy Policy, Terms) open in Safari/WebView
- [ ] No reference to Android or competing platforms
- [ ] Restore Purchases button present and functional

### Build & Submit
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Google Play Store

### Pre-submission
- [ ] Package name: `com.katha.ai`
- [ ] Google Play Console account with merchant agreement
- [ ] App signing key enrolled in Google Play App Signing
- [ ] Feature graphic: 1024x500
- [ ] Screenshots: Phone (min 2), Tablet (if supported)
- [ ] Hi-res icon: 512x512

### Privacy & Compliance
- [ ] Privacy Policy URL in Play Console
- [ ] Data Safety section filled:
  - Data shared: None
  - Data collected: Email, name, app interactions
  - Security practices: data encrypted in transit, data deletion available
- [ ] Content rating questionnaire completed (expected: Everyone)
- [ ] Target audience: 13+ (or comply with Families Policy if targeting kids)
- [ ] Ads declaration: No ads (or declare ad SDK if ads added later)

### In-App Purchases
- [ ] Products created in Play Console:
  - `premium_monthly` (Subscription, ₹149/mo)
  - `premium_yearly` (Subscription, ₹999/yr)
  - `family_monthly` (Subscription, ₹249/mo)
- [ ] Base plans and offers configured
- [ ] Real-time Developer Notifications Pub/Sub topic configured
- [ ] License testing accounts added
- [ ] Purchase flow tested with test card numbers

### Google Sign-In
- [ ] OAuth consent screen configured
- [ ] Android SHA-1 fingerprint added to OAuth credentials
- [ ] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET set

### Build & Submit
```bash
eas build --platform android --profile production
eas submit --platform android
```

---

## Post-Launch Checklist

- [ ] Monitor crash rate in first 24 hours (target: < 1%)
- [ ] Monitor API error rate (target: < 0.1%)
- [ ] Respond to first App Store / Play Store reviews within 48 hours
- [ ] Verify subscription webhooks are being received
- [ ] Verify analytics events flowing to dashboard
- [ ] Schedule first over-the-air update via EAS Update
