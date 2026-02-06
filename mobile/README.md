# RevSync Mobile (Cross-Platform)

This is the cross-platform mobile application for RevSync, built with **React Native** and **Expo**. It shares the same Django backend as the iOS native app.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (or Android Studio / Xcode for simulators)

### Installation

1.  Navigate to the mobile directory:
    ```bash
    cd mobile
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your Supabase credentials and Backend URL.

4.  Start the app:
    ```bash
    npx expo start
    ```

## 📁 Project Structure

## 📁 Project Structure (Clean Architecture)

```
mobile/
├── src/
│   ├── auth/                # Auth logic (Context, legacy files) -- To be migrated
│   ├── presentation/        # UI Layer (Screens, Components, Navigation)
│   │   ├── components/
│   │   ├── navigation/
│   │   └── screens/
│   │       ├── auth/
│   │       ├── flash/
│   │       ├── garage/
│   │       ├── profile/
│   │       └── tunes/
│   ├── domain/              # Business Logic (Entities, Usecases)
│   ├── data/                # Data Layer (Repositories, API Implementation)
│   ├── services/            # Legacy Services (Migration in progress)
│   ├── types/               # Shared Type Definitions
│   ├── styles/              # Global Styles
│   └── store/               # State Management
├── App.tsx                  # Entry point
└── app.json                 # Expo configuration
```

## 🛡️ Architecture Guardrails

To maintain scalability and reliability, strict layer boundaries are enforced:

1.  **Strict Layering**:
    *   **Presentation Layer** (`src/presentation`) should ONLY import from `domain` or `services` (legacy). It should NEVER import from `data` directly.
    *   **Domain Layer** (`src/domain`) must be pure TypeScript. It cannot import from `presentation` (no React components) or `data` (no axios/API implementations).
    *   **Data Layer** (`src/data`) implements the interfaces defined in `domain`. It owns the HTTP client (axios) and storage mechanics.

2.  **State Management**:
    *   Global state (User, Settings) is managed via **Zustand** stores in `src/presentation/store` (or legacy `src/store`).
    *   Local state should remain in components.

3.  **Cross-Platform Only**:
    *   Do not use iOS-only or Android-only libraries without a fallback or platform check.

4.  **One Source of Truth**:
    *   Models are defined in `src/types/models.ts` or `domain/entities`. Do not duplicate interface definitions in screens.

## 🔌 Backend Integration

The app connects to the RevSync Django backend. Ensure the backend is running:

```bash
cd ../backend
python manage.py runserver
```

**Note for Android Emulator:** Use `http://10.0.2.2:8000/api` in your `.env` to access localhost.
**Note for Physical Device:** Use your computer's local IP address (e.g., `http://192.168.1.x:8000/api`).
