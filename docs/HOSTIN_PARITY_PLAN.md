# HostIn mobile parity map

Source of truth: [`1forgeco/HostIn`](https://github.com/1forgeco/HostIn), `main` branch.

## Roles

| Role | Mobile workspace modules |
| --- | --- |
| Owner | Dashboard, properties, rooms, people and roles, credentials, requests, gate passes, visitors, complaints, dues and payments, community, mess, documents, staff contacts, billing, reports, settings |
| Warden | Dashboard, rooms, tenants, complaints, gate passes, visitors, announcements, staff contacts, documents |
| Guard | Gate passes, visitors, staff contacts |
| Mess Manager (`staff`) | Community, mess, staff contacts |
| Tenant | Gate passes, dues and payments, community, mess, staff contacts |
| Parent | Home, child profile, gate pass, billing, mess menu, announcements, contacts, help and concerns, documents |
| 1Forge Platform | Organizations, plans, onboarding, feature controls, notifications and analytics |

The same user can have multiple organization-role memberships. After login, mobile must allow switching among the entries returned in `session.availableRoles` without requesting credentials again.

## Authentication

- Login: `POST /api/auth/resolve-login`
- Current user and access snapshot: `GET /api/auth/me`
- Session renewal: `POST /api/auth/session/refresh`
- Forced first-login password change: `POST /api/auth/change-password`
- Tokens are stored in Keychain/Keystore through Expo SecureStore on native devices.
- The existing backend uses a secure refresh cookie. A mobile-safe refresh-token response or dedicated device-session endpoint must be added without changing browser behavior.

## Operational APIs

- Rooms and floors: `/api/floors/*`, `/api/rooms/*`
- Residents: `/api/tenants/*`
- Gate passes: `/api/gate-passes/*`
- Visitors: `/api/visitors/*`
- Complaints: `/api/complaints/*`
- Announcements: `/api/announcements/*`
- Dues and payments: `/api/dues/*`, `/api/payments/*`
- Mess: `/api/mess-menus/*`, `/api/mess-feedback/*`
- Documents: `/api/documents/*`
- Community and lost/found: `/api/community/*`
- Staff contacts: `/api/staff-contacts/*`
- Parents: `/api/parents/*`
- Owner control: `/api/owner/dashboard`, `/api/owner/requests`
- Warden summary: `/api/warden/dashboard`
- Alerts: `/api/notifications/*`
- 1Forge control center: `/api/platform/*`

## Implementation rule

The mobile application never accesses PostgreSQL directly. It shares the existing production backend and database with the web application. Development and staging use isolated databases.

## Mobile implementation status

Completed in the mobile client:

- Direct login with Owner, Warden, Guard, Mess Manager, Tenant, Parent, and separate 1Forge Platform access.
- Secure native session storage, first-login password change, logout invalidation, and multi-workspace/role switching.
- Role-filtered dashboards and every role module listed above.
- Search, refresh, empty/error states, create forms, and preview records for every module.
- Gate-pass approval/rejection/check-in/check-out/cancel; visitor approval/check-in/check-out; complaint status; document verification.
- Tenant payments, mess feedback, lost-and-found, parent concerns, announcements, rooms, residents, dues, documents, staff, and owner requests.
- In-app notifications with live loading and mark-as-read.
- Native photo/document picking, offline status, notification permissions, push deep-link routing, and configurable backend token registration.
- Parent linking/privacy, room removal, staff updates, and platform account/role/permission/onboarding controls.
- Android/iOS identifiers and EAS development, preview, production, and submission profiles.

External release dependencies:

- Set the real `EXPO_PUBLIC_API_URL` for the deployed HostIn backend.
- Apple Developer/App Store Connect and Google Play Console credentials are required to sign and submit builds.
- Native push notifications need a backend device-token registration/send API; the reference backend currently exposes in-app notification list/read/stream only.
- Direct document file uploads need a storage or presigned-upload endpoint; the reference document API currently accepts an existing `fileUrl`.
