# RevSync Backend Implementation Plan

## Overview
This document outlines the architecture for the RevSync backend, utilizing Django (DRF) for the API layer and Supabase for the database (PostgreSQL) and authentication integration.

## 1. File Structure
```
backend/
├── manage.py
├── revsync_backend/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── users/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   └── permissions.py
├── tuners/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── services.py
├── garage/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── marketplace/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── core/
    ├── __init__.py
    ├── utils.py
    ├── authentication.py
    └── pagination.py
```

## 2. Data Models

### Users App
- **User**: Custom user model (AbstractUser) with role (RIDER, TUNER, CREATOR, ADMIN).
- **UserProfile**: One-to-one with User. Bio, location, experience, stats.
- **UserDevice**: Track logged-in devices.

### Tuners App
- **TunerProfile**: One-to-one with User (if role=TUNER). Business info, rating, verification status.
- **TunerCertification**: Documents uploaded for verification.
- **TunerReview**: Reviews from users.

### Garage App
- **Vehicle**: User's bikes/cars. Make, model, year, VIN (optional), mods.

### Marketplace App
- **Tune**: The product. File, price, compatibility, stats.
- **Purchase**: Transaction record.
- **Download**: Audit log of downloads.

## 3. API Endpoints (Summary)
- `/auth/*`: Registration, Login (JWT), Refresh.
- `/users/*`: Profile management.
- `/tuners/*`: Tuner discovery, application, details.
- `/garage/*`: Vehicle management.
- `/marketplace/*`: Tune browsing, purchasing.

## 4. Supabase Integration
- **Auth**: Django handles auth logic but syncs/validates with Supabase if using their Auth service, or we manage our own JWTs and just use Supabase as DB. *Decision: We will implement standard Django JWT (SimpleJWT) for maximum control as requested, using Supabase purely as the Postgres DB.*
- **Storage**: We will use `django-storages` with S3-compatible Supabase Storage.

## 5. Security
- Role-Based Access Control (RBAC) using custom Permissions classes.
- Input validation via DRF Serializers.
