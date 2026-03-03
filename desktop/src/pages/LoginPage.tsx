import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const err = await login(email, password);
        if (err) { setError(err); setLoading(false); }
        else navigate('/');
    };

    return (
        <div className="h-screen bg-bg-dark flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 dot-grid pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,16,60,0.08)_0%,transparent_70%)]" />

            <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-sm p-8 rounded-2xl border border-border-dark bg-panel-dark/80 backdrop-blur-xl animate-fade-up">
                <div className="flex flex-col items-center mb-8">
                    <span className="material-symbols-outlined text-primary text-5xl mb-3">memory</span>
                    <h1 className="text-2xl font-black tracking-tight text-white">RevSync Pro</h1>
                    <p className="text-text-muted text-sm mt-1">Professional ECU Workbench</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-[11px] uppercase tracking-wider font-bold text-text-muted mb-1.5 block">Email</label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="tuner@revsync.com" required autoFocus
                            className="w-full h-11 px-4 bg-bg-dark border border-border-dark rounded-lg text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] uppercase tracking-wider font-bold text-text-muted mb-1.5 block">Password</label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                            className="w-full h-11 px-4 bg-bg-dark border border-border-dark rounded-lg text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full h-12 mt-2 bg-primary hover:bg-red-600 text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(234,16,60,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_open</span> Sign In</>
                        )}
                    </button>
                </div>

                <div className="mt-6 space-y-3">
                    <p className="text-center text-text-muted text-[10px]">RevSync Pro v2.4.1 (Build 8902)</p>
                    <div className="flex items-center justify-center gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                        <Link to="/legal/privacy" className="hover:text-white">Privacy</Link>
                        <Link to="/legal/terms" className="hover:text-white">Terms</Link>
                        <Link to="/legal/safety-disclaimer" className="hover:text-white">Safety</Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
