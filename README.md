# Hostin Mobile

Cross-platform Hostin application for iOS and Android, built with Expo 57, React Native, TypeScript, and Expo Router.

## Run locally

```bash
npm install
npm run web
```

For native development, use `npm run ios` or `npm run android` with the appropriate simulator installed.

## Preview login

Until the existing HostIn API is connected, the app runs in preview mode using the accounts from the web repository. Choose Owner, Warden, Guard, Mess Manager, Tenant, Parent, or 1Forge Platform on the login screen. City Complex roles use `city-complex@123`; Platform uses `PlatformAdminPassword123`.

## Connect the existing backend

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the existing backend API root, including `/api`. The mobile adapter calls `POST /auth/resolve-login` and normalizes the existing HostIn session response for encrypted native storage.

The app never connects directly to the database. Both the web and mobile clients should use the same backend API and production database.

Preview mode is intentionally disabled for EAS `preview` and `production` builds with `EXPO_PUBLIC_ALLOW_PREVIEW=false`. Set `EXPO_PUBLIC_API_URL` in EAS environment variables before building those profiles, otherwise login fails fast instead of showing demo data.

## Build for Android and iOS

Follow the tested release sequence and owner-input checklist in [docs/STORE_LAUNCH.md](docs/STORE_LAUNCH.md). Store submission additionally requires the organization’s Expo, Google Play, and Apple Developer credentials; those are intentionally not stored in this repository.
