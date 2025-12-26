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

```
mobile/
├── src/
│   ├── auth/           # Authentication (Screens, Context, Services)
│   ├── components/     # Reusable UI components
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Main app screens
│   ├── services/       # API and Supabase services
│   ├── settings/       # Settings screens and logic
│   ├── store/          # Redux store
│   ├── styles/         # Global styles
│   └── types/          # TypeScript definitions
├── App.tsx             # Entry point
└── app.json            # Expo configuration
```

## 🔌 Backend Integration

The app connects to the RevSync Django backend. Ensure the backend is running:

```bash
cd ../backend
python manage.py runserver
```

**Note for Android Emulator:** Use `http://10.0.2.2:8000/api` in your `.env` to access localhost.
**Note for Physical Device:** Use your computer's local IP address (e.g., `http://192.168.1.x:8000/api`).
