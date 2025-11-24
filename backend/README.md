# RevSync Backend

Django + Supabase backend for RevSync, serving as the single source of truth for user data, vehicle configurations, and marketplace content.

## Features

- **Authentication**: Custom JWT auth integrated with Supabase sessions (`AppSession`).
- **Core Data**: Vehicles, Tunes, Purchases, and User Profiles.
- **Marketplace**: Tune listing, purchasing, and file management (Supabase Storage).
- **Garage**: Vehicle management, ECU backups, and Flash Jobs.
- **Safety Layer**: AI-driven safety analysis for tune/vehicle combinations.
- **Sync**: `Last-Modified-Since` protocol with soft deletes (Tombstones) for efficient offline support.

## Setup

1.  **Environment Variables**:
    Ensure the following are set (or use defaults in `settings.py` for dev):
    - `DATABASE_URL`: Connection string for Supabase Postgres.
    - `SUPABASE_URL`: Your Supabase project URL.
    - `SUPABASE_KEY`: Your Supabase anon/service key.
    - `SUPABASE_ACCESS_KEY_ID`: S3 Access Key.
    - `SUPABASE_SECRET_ACCESS_KEY`: S3 Secret Key.
    - `SUPABASE_BUCKET_NAME`: Storage bucket name.

2.  **Install Dependencies**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Run Migrations**:
    ```bash
    python manage.py migrate
    ```

4.  **Run Server**:
    ```bash
    python manage.py runserver
    ```

## API Documentation

The API specification is available in OpenAPI 3.1 format at `openapi.yaml`.
You can also view the schema endpoint at `/api/schema/` when the server is running.

## Key Endpoints

- **Auth**: `/api/v1/auth/login/`, `/api/v1/auth/register/`
- **Garage**: `/api/v1/garage/vehicles/`, `/api/v1/garage/flash-jobs/`
- **Marketplace**: `/api/v1/marketplace/tunes/`, `/api/v1/marketplace/purchase/`
- **Safety**: `/api/v1/safety/analyze/`

## Sync Protocol

Clients should store the timestamp of their last successful sync.
To fetch updates:
`GET /api/v1/garage/vehicles/?since=2023-10-27T10:00:00Z`

This returns all records modified after the timestamp, including soft-deleted records (which will have a `deleted_at` field).
