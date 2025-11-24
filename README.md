# RevSync Platform

![RevSync Banner](https://via.placeholder.com/1200x300?text=RevSync+Platform)

**RevSync** is the world's first AI-powered, community-driven motorcycle tuning ecosystem. It bridges the gap between professional tuners and everyday riders, providing a seamless platform for ECU flashing, real-time telemetry, and performance analytics.

Built with a native **SwiftUI** iOS client and a robust **Django REST Framework** backend, RevSync leverages **Supabase** for real-time capabilities and secure storage.

---

## 🌟 Key Features

### 🏍️ For Riders
- **Garage Management**: Digital twins for your motorcycles. Track mods, service history, and VIN-specific details.
- **Tune Marketplace**: Browse, purchase, and flash tunes from verified professionals.
- **Live Telemetry**: Real-time dashboard showing RPM, Speed, TPS, and Engine Temp via OBD-II.
- **AI Safety Checks**: Automated analysis of tune files to detect dangerous parameters (lean conditions, excessive timing) before you flash.
- **Social Graph**: Follow your favorite tuners, like builds, and share your dyno charts.

### 🔧 For Tuners
- **Creator Dashboard**: Upload binary files, manage pricing, and view sales analytics.
- **Portfolio**: Showcase your best work with verified dyno charts and customer reviews.
- **Direct Support**: Built-in messaging to support your customers.

### 🧠 AI & Safety
- **Tune Analyzer**: "Credit Score" style safety ratings for every tune file.
- **Risk Meter**: Visual gauge showing the aggressiveness of a tune.
- **Pre-Flash Validation**: Hardware checks to ensure battery voltage and ECU compatibility.

---

## 🏗️ System Architecture

The platform consists of three main components:

1.  **iOS Client (Swift)**:
    - **MVVM+C Architecture**: Clean separation of concerns with Combine for reactive updates.
    - **Hardware Layer**: `Network.framework` integration for TCP/IP communication with ELM327 WiFi adapters.
    - **Offline First**: Core Data caching for garage and tune library access without internet.

2.  **Backend API (Django)**:
    - **REST API**: Comprehensive endpoints for users, vehicles, and marketplace transactions.
    - **Supabase Integration**: Delegates Auth and Storage to Supabase while maintaining business logic in Django.
    - **Celery Tasks**: Async processing for heavy tune analysis jobs.

3.  **Database & Realtime (Supabase)**:
    - **PostgreSQL**: Primary data store.
    - **Realtime**: WebSocket channels for flash progress streaming and chat.
    - **Storage**: Secure S3-compatible buckets for binary files and images.

---

## 🚀 Getting Started

### Prerequisites
- **macOS** 14.0+ (Sonoma)
- **Xcode** 15.0+
- **Python** 3.10+
- **PostgreSQL** 14+ (or Supabase project)
- **ELM327 WiFi Adapter** (for hardware testing)

### 1. Backend Setup

The backend manages the API, database connections, and business logic.

```bash
# 1. Clone the repository
git clone https://github.com/your-org/revsync.git
cd revsync/backend

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure Environment Variables
# Create a .env file in backend/core/
cp core/.env.example core/.env
# Edit core/.env with your Supabase credentials:
# DJANGO_SECRET_KEY=...
# DATABASE_URL=postgres://user:pass@localhost:5432/revsync
# SUPABASE_URL=...
# SUPABASE_KEY=...

# 5. Run Migrations
python manage.py migrate

# 6. Create Superuser (Admin)
python manage.py createsuperuser

# 7. Start the Development Server
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`.
Access the Admin panel at `http://127.0.0.1:8000/admin/`.

### 2. Frontend Setup (iOS)

The iOS app is the primary interface for users.

1.  Open `RevSyncApp.xcodeproj` in Xcode.
2.  **Configuration**:
    - Open `Services/API/APIClient.swift`.
    - Ensure `baseURL` points to your local backend (`http://127.0.0.1:8000/api/`).
    - *Note: If testing on a physical device, use your computer's local IP address (e.g., `http://192.168.1.50:8000/api/`).*
3.  **Signing**:
    - Select the "RevSyncApp" target.
    - Go to "Signing & Capabilities".
    - Select your Development Team.
4.  **Build & Run**:
    - Select a Simulator (iPhone 15 Pro recommended) or your physical device.
    - Press `Cmd+R`.

---

## 🔌 Hardware Integration Guide

RevSync supports standard **ELM327 WiFi** OBD-II adapters.

**Supported Devices:**
- Vgate iCar Pro WiFi
- OBDLink MX+ (WiFi Mode)
- Generic ELM327 WiFi Clones (v1.5 recommended)

**Connection Steps:**
1.  Plug the adapter into the motorcycle's diagnostic port (may require a 4-pin/6-pin to OBD adapter cable).
2.  Turn the ignition key to **ON** (Engine off or running).
3.  On your iOS device, go to **Settings > Wi-Fi** and connect to the adapter's network (often named `V-LINK`, `OBDII`, or `WiFi_OBD`).
4.  Open RevSync and navigate to **Garage > Live Monitor**.
5.  The app will auto-negotiate the protocol (ISO 15765-4 CAN is standard for modern bikes).

**Troubleshooting:**
- **Connection Refused**: Ensure no other app is using the adapter.
- **No Data**: Check if the kill switch is in the "Run" position.
- **Timeout**: Some cheap adapters have high latency; try the "Slow Mode" in App Settings.

---

## 🧪 Testing

### Unit Tests
Run the Swift test suite to verify view models and services.
```bash
# In Xcode
Cmd+U
```

### Hardware Simulation
Don't have a bike nearby? Use the built-in **Mock Adapter**.
1.  In `OBDClient.swift`, set `useMock` to `true`.
2.  The app will simulate a connection and generate fake RPM/Speed data for UI testing.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1.  **Fork** the repository.
2.  Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

**Code Style:**
- **Swift**: Follows standard Swift API Design Guidelines.
- **Python**: Follows PEP 8. Use `black` for formatting.

---

## � License

Copyright © 2025 RevSync Inc. All rights reserved.
Proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.
