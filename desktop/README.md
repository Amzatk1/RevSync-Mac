# RevSync Desktop

> **Status**: Planned — will be built after Web app is stable.

## Purpose

The desktop app handles advanced flashing workflows that require:

- USB/JTAG hardware connections (not BLE-limited)
- Pro tuner workbench tools (hex editor, map editor, live logging)
- Batch flashing for dealer/workshop environments
- Advanced diagnostics and data logging

## Planned Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Electron or Tauri |
| UI | React (shared components with web) |
| Serial/USB | Node.js `serialport` or Tauri `serial` plugin |
| Build | electron-builder / tauri-bundle |
| Platforms | Windows, macOS |

## Folder Structure (planned)

```
desktop/
├── src/
│   ├── main/           # Electron/Tauri main process
│   ├── renderer/       # React UI (shared design system)
│   ├── services/       # USB flash, serial comms
│   └── components/     # Shared with web where possible
├── package.json
└── README.md
```

## When to Start

Build this **after**:
1. ✅ Mobile app is stable and in production
2. ⬜ Web app marketplace + tuner dashboard is live
3. ⬜ USB/JTAG protocol is defined alongside BLE protocol
