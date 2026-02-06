# Production Service Setup Guide

To move RevSync from "Prototype" to "Production", you need to sign up for the following services and obtain API keys.

## 1. Supabase (Database, Auth, Storage)
**Purpose**: User management, PostgreSQL database, and file storage for Tunes/Logs.
- **Website**: [https://supabase.com](https://supabase.com)
- **Action**: Create a new project.
- **Keys Needed**:
  - `Project URL` (e.g., https://xyz.supabase.co)
  - `Anon Key` (Public, for Mobile App)
  - `Service Role Key` (Secret, for Backend Validation Workers)
- **Config Location**:
  - Backend: `.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)
  - Mobile: `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)

## 2. Stripe (Payments)
**Purpose**: Processing credit card payments for Tune purchases.
- **Website**: [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
- **Action**: Create an account and a new business.
- **Keys Needed**:
  - `Publishable Key` (pk_test_..., for Mobile App)
  - `Secret Key` (sk_test_..., for Backend)
  - `Webhook Secret` (whsec_..., for Backend to verify events)
- **Config Location**:
  - Backend: `.env` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
  - Mobile: `.env` (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`)

## 3. ClamAV (Malware Scanning)
**Purpose**: Scanning uploaded tune files for viruses before they are listed.
- **Type**: Open Source Software (Daemon)
- **Action**: 
  - **Local/VPS**: Install via `apt-get install clamav-daemon`.
  - **Managed**: or use a service like [Cloudmersive](https://cloudmersive.com/virus-scan-api) if you don't want to manage a server.
- **Recommendation for MVP**: Run ClamAV locally on your Django server.

## 4. SendGrid or AWS SES (Transactional Email)
**Purpose**: Sending "Confirm Email" and "Receipt" emails.
- **Website**: [https://sendgrid.com](https://sendgrid.com) or [https://aws.amazon.com/ses](https://aws.amazon.com/ses)
- **Keys Needed**: `API Key`
- **Config Location**: Backend settings (Django Email Backend).

---

# Configuration File Templates

### Backend `.env`
```bash
DEBUG=False
SECRET_KEY=your_django_secret_key_here
ALLOWED_HOSTS=api.revsync.com

# Database
DATABASE_URL=postgres://user:pass@db.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Mobile `.env`
```bash
EXPO_PUBLIC_API_URL=https://api.revsync.com/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
