# RevSync Platform

**RevSync** is the world's first AI-powered, community-driven motorcycle tuning ecosystem. It bridges the gap between professional tuners and everyday riders, providing a seamless platform for ECU flashing, real-time telemetry, and performance analytics.

Built with a **React Native / Expo** mobile client and a robust **Django REST Framework** backend, RevSync leverages **Supabase** for real-time capabilities and secure auth.

---

## 🌟 Key Features

### 🏍️ For Riders
- **Garage Management** — Digital twins for your motorcycles. Track mods, service history, and VIN-specific details.
- **Tune Marketplace** — Browse, purchase, and flash tunes from verified professionals.
- **Live Telemetry** — Real-time dashboard showing RPM, Speed, TPS, and Engine Temp via BLE/OBD-II.
- **AI Safety Checks** — Automated analysis of tune files to detect dangerous parameters before flashing.
- **Social Graph** — Follow your favorite tuners, like builds, and share your dyno charts.

### 🔧 For Tuners
- **Creator Dashboard** — Upload binary files, manage pricing, and view sales analytics.
- **Portfolio** — Showcase your best work with verified dyno charts and customer reviews.
- **Direct Support** — Built-in messaging to support your customers.

### 🧠 AI & Safety
- **Tune Analyzer** — "Credit Score" style safety ratings for every tune file.
- **Pre-Flash Validation** — Hardware + battery checks to ensure ECU compatibility.
- **Multi-stage Validation Pipeline** — Malware scanning, archive bomb detection, schema validation, and integrity verification.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────┐
│                  Mobile App                     │
│        React Native · Expo · TypeScript         │
│     Zustand • React Navigation • BLE • Crypto   │
└─────────────────────┬──────────────────────────┘
                      │ REST API (JSON)
┌─────────────────────▼──────────────────────────┐
│                Backend API                      │
│          Django 5 · DRF · SimpleJWT             │
│   Marketplace · Garage · Payments · Safety      │
│         Celery · Redis (async tasks)            │
└─────────────────────┬──────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────┐
│          Database & Storage                     │
│    SQLite (dev) · PostgreSQL (prod)             │
│    Supabase (auth · realtime · storage)         │
└────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
RevSyncApp/
├── backend/                # Django REST API
│   ├── core/               # Django settings & root URLs
│   ├── garage/             # Bike/vehicle management
│   ├── marketplace/        # Tune listings, uploads, validation pipeline
│   ├── payments/           # Stripe integration
│   ├── safety_layer/       # Multi-stage validation (malware, schema, integrity)
│   ├── users/              # User profiles, auth
│   ├── chat/               # Direct messaging
│   ├── manage.py
│   └── requirements.txt
│
├── mobile/                 # React Native / Expo app
│   ├── src/
│   │   ├── data/           # Services, HTTP client, storage
│   │   ├── di/             # Dependency injection (ServiceLocator)
│   │   ├── domain/         # Types, interfaces, safety engine
│   │   ├── presentation/   # Screens, components, navigation, stores
│   │   └── services/       # Legal, analytics
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                   # Additional documentation
└── legacy_ios_mac/         # Legacy SwiftUI client (archived)
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 18+ | LTS recommended |
| **Python** | 3.10+ | For the Django backend |
| **Expo Go** | Latest | Install on your phone from App Store / Play Store |
| **Git** | Any | For cloning |

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/revsync.git
cd RevSyncApp
```

---

### 2. Start the Backend (Django)

```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# (Optional) Create an admin superuser
python manage.py createsuperuser

# Start the development server
python manage.py runserver 0.0.0.0:8000
```

> [!TIP]
> Using `0.0.0.0:8000` makes the backend accessible from your phone on the same Wi-Fi network (use your computer's local IP).

The API is now live:
- **API root**: `http://localhost:8000/api/`
- **Admin panel**: `http://localhost:8000/admin/`
- **OpenAPI docs**: `http://localhost:8000/api/schema/`

#### Environment Variables

Create a `.env` file in `backend/` (one already exists for dev defaults):

```env
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_test_...
```

---

### 3. Start the Mobile App (Expo)

Open a **new terminal** tab:

```bash
# Navigate to mobile directory
cd mobile

# Install Node.js dependencies
npm install

# Start the Expo dev server
npm start
```

This launches the **Expo CLI**. You'll see a QR code in your terminal.

#### Running on Your Device

| Method | Steps |
|--------|-------|
| **Expo Go (recommended)** | Scan the QR code with your phone's camera. Expo Go opens automatically. |
| **iOS Simulator** | Press `i` in the terminal to launch the iOS Simulator. |
| **Android Emulator** | Press `a` in the terminal to launch the Android Emulator. |

> [!IMPORTANT]
> **Auth is bypassed for testing.** Any email/password combination will sign you in successfully. No real Supabase credentials needed.

#### Mobile Environment Variables

If connecting to a backend on a different machine, update the API URL:

```bash
# In mobile/.env or as an export
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api
```

---

### 4. Running Both Together (Quick Start)

Open **two terminal tabs** and run:

**Tab 1 — Backend:**
```bash
cd RevSyncApp/backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

**Tab 2 — Mobile:**
```bash
cd RevSyncApp/mobile
npm start
```

Then scan the QR code with Expo Go on your phone. Sign in with any credentials.

---

## 📱 App Screens

| Tab | Key Screens |
|-----|-------------|
| **Tunes** | Marketplace browse, tune details, download manager |
| **Garage** | Bike list, add bike, bike details |
| **Flash** | Device connect, ECU identify, backup, flash wizard, verification, recovery |
| **Profile** | Settings, privacy, support, about, agreements, safety settings, logs export |

---

## 🔌 Hardware Integration

RevSync supports BLE (Bluetooth Low Energy) communication with ECU flash devices.

**Connection Flow:**
1. Navigate to **Flash** → **Connect Device**
2. The app scans for nearby BLE devices
3. Select your RevSync ECU adapter
4. Once connected, you can identify the ECU, create backups, and flash tunes

> [!NOTE]
> A **Mock Device Service** is enabled by default for development. To test with real hardware, update `ServiceLocator.ts` to use `BleDeviceService`.

---

## 🧪 Testing

### TypeScript Type Check
```bash
cd mobile
npx tsc --noEmit
```

### Backend Tests
```bash
cd backend
source venv/bin/activate
python manage.py test
```

### Backend Validation Pipeline Tests
```bash
cd backend
python manage.py test marketplace.tests.test_pipeline
python manage.py test marketplace.tests.test_hardening
```

---

## 🛠️ Tech Stack

### Mobile
| Technology | Purpose |
|-----------|---------|
| React Native 0.81 | Cross-platform UI |
| Expo SDK 54 | Development toolchain |
| TypeScript 5.9 | Type safety |
| Zustand | State management |
| React Navigation 7 | Navigation |
| expo-secure-store | Encrypted session storage |
| react-native-ble-plx | BLE communication |
| tweetnacl | Cryptographic operations |

### Backend
| Technology | Purpose |
|-----------|---------|
| Django 5 | Web framework |
| DRF (Django REST Framework) | REST API |
| SimpleJWT | JWT authentication |
| Celery + Redis | Async task processing |
| Stripe | Payment processing |
| python-magic + pyclamd | File validation & malware scanning |
| drf-spectacular | OpenAPI schema generation |

---

## 🤝 Contributing

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

**Code Style:**
- **TypeScript**: Strict mode, no `any` unless necessary
- **Python**: PEP 8, use `black` for formatting

---

## 📄 License

Copyright © 2025 RevSync Inc. All rights reserved.
Proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.
