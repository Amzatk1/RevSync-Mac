import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import WorkbenchPage from './pages/WorkbenchPage';
import MapEditorPage from './pages/MapEditorPage';
import FlashManagerPage from './pages/FlashManagerPage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import ConnectionPage from './pages/ConnectionPage';
import RecoveryPage from './pages/RecoveryPage';
import BatchQueuePage from './pages/BatchQueuePage';
import LegalPage from './pages/LegalPage';

export default function App() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="rs-shell flex h-screen items-center justify-center px-6">
                <div className="rs-panel-raised flex w-full max-w-md flex-col items-center gap-4 rounded-[24px] p-8 text-center animate-fade-in">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[var(--rs-primary)]/25 bg-[var(--rs-primary)]/10">
                        <span className="material-symbols-outlined text-4xl text-[var(--rs-primary)] animate-pulse">memory</span>
                    </div>
                    <div>
                        <p className="rs-section-label m-0">RevSync Pro</p>
                        <h1 className="mt-2 text-xl font-black text-[var(--rs-text-primary)]">Initializing workstation</h1>
                        <p className="mt-2 text-sm text-[var(--rs-text-secondary)]">Loading authenticated shell, safety policy state, and command surfaces.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/legal" element={<Navigate to="/legal/privacy" replace />} />
                <Route path="/legal/:docKey" element={<LegalPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <AppShell>
            <Routes>
                <Route path="/" element={<Navigate to="/workbench" replace />} />
                <Route path="/workbench" element={<WorkbenchPage />} />
                <Route path="/maps" element={<MapEditorPage />} />
                <Route path="/flash" element={<FlashManagerPage />} />
                <Route path="/diagnostics" element={<DiagnosticsPage />} />
                <Route path="/connect" element={<ConnectionPage />} />
                <Route path="/recovery" element={<RecoveryPage />} />
                <Route path="/batch" element={<BatchQueuePage />} />
                <Route path="/legal" element={<Navigate to="/legal/privacy" replace />} />
                <Route path="/legal/:docKey" element={<LegalPage />} />
                <Route path="*" element={<Navigate to="/workbench" replace />} />
            </Routes>
        </AppShell>
    );
}
