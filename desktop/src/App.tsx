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

export default function App() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen bg-bg-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <span className="material-symbols-outlined text-primary text-5xl animate-pulse">memory</span>
                    <p className="text-text-muted text-sm font-mono">Initializing RevSync Pro...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
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
                <Route path="*" element={<Navigate to="/workbench" replace />} />
            </Routes>
        </AppShell>
    );
}
