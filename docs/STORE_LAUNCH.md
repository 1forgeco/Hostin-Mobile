# HostIn mobile store launch

This repository is prepared for EAS development, internal-preview, and production builds. Store submission still requires values and accounts owned by the HostIn business; those must not be invented or committed to Git.

## Release inputs required from the owner

- Confirm the final app name, Apple bundle identifier, and Android package name. The current identifiers are `com.hostin.mobile`; changing them after a store record is created is disruptive.
- A production HTTPS API root ending in `/api`, backed by the same HostIn production backend and database as the web application.
- A public privacy-policy URL and a monitored support email.
- Expo account access, an Apple Developer/App Store Connect account, and a Google Play Console account.
- Final store copy, category, countries, age rating, support URL, screenshots, and review credentials for every restricted role.
- Accurate Apple App Privacy and Google Play Data Safety declarations covering identity, contact details, property/residency records, payment records, photos/documents, and diagnostics actually processed by production.

## Technical release sequence

1. Create `.env` from `.env.example` and use the production HTTPS API.
2. Run `npm run check`.
3. Sign in and link the repository to the correct Expo organization:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```

4. Add production public environment variables with EAS environment management. Do not commit secrets or store service-account files.
5. Build a development client and test all seven roles on physical Android and iOS devices. Push notifications require a development build rather than Expo Go on Android.
6. Build internal releases:

   ```bash
   npx eas-cli@latest build --platform all --profile preview
   ```

7. Complete Play internal testing and TestFlight, fix defects, and get business acceptance.
8. Build store binaries:

   ```bash
   npx eas-cli@latest build --platform all --profile production
   ```

9. Submit the approved binaries:

   ```bash
   npx eas-cli@latest submit --platform android --profile production
   npx eas-cli@latest submit --platform ios --profile production
   ```

EAS Submit uploads Android to the selected Play track and iOS to TestFlight. Apple’s App Store review promotion remains a separate App Store Connect step.

## Backend launch gates

- CORS and cookie policy must allow the production mobile API flow; access-token refresh must be verified on both platforms.
- Add a device push-token registration/revocation endpoint and a delivery worker before claiming remote push is live. Set `EXPO_PUBLIC_PUSH_REGISTER_PATH` to that endpoint.
- Replace embedded data-URL document storage with a storage/presigned-upload endpoint before accepting production identity documents at scale.
- Confirm backups, monitoring, rate limits, audit retention, incident response, account/data deletion handling, and separate staging data.

## Store policy gates

- Apple requires a privacy-policy link in App Store Connect and inside the app, plus accurate privacy disclosures: https://developer.apple.com/app-store/app-privacy-details/
- Google requires the Data Safety form and app-access instructions for restricted apps: https://support.google.com/googleplay/android-developer/answer/10787469
- As of 31 August 2026, new Google Play apps and updates must target Android 16/API 36. Expo SDK 57 targets API 36: https://support.google.com/googleplay/android-developer/answer/11926878
- Use internal testing before production. New personal Play accounts may have additional closed-testing requirements: https://support.google.com/googleplay/android-developer/answer/9859348
