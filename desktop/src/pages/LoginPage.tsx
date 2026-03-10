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
        <div className="rs-shell relative flex h-screen items-center justify-center overflow-hidden">
            <div className="rs-gridline absolute inset-0 pointer-events-none opacity-[0.08]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,199,255,0.12)_0%,transparent_45%)]" />

            <form onSubmit={handleSubmit} className="rs-panel-elevated relative z-10 w-full max-w-[420px] rounded-[28px] p-8 animate-fade-up">
                <div className="flex flex-col items-center mb-8">
                    <span className="material-symbols-outlined mb-3 text-5xl text-[var(--rs-accent)]">memory</span>
                    <h1 className="text-3xl font-black tracking-tight text-white">RevSync Pro</h1>
                    <p className="mt-1 text-sm text-[var(--rs-text-secondary)]">Desktop workbench for controlled tuning, validation, and release</p>
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-[16px] border border-[rgba(234,16,60,0.24)] bg-[rgba(234,16,60,0.08)] p-3 text-xs text-[var(--rs-danger)]">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--rs-text-tertiary)]">Email</label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="tuner@revsync.com" required autoFocus
                            className="rs-input"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--rs-text-tertiary)]">Password</label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                            className="rs-input"
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="rs-toolbar-button rs-button-primary mt-2 h-12 w-full justify-center disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_open</span> Sign In</>
                        )}
                    </button>
                </div>

                <div className="mt-6 space-y-3">
                    <p className="text-center text-[10px] text-[var(--rs-text-tertiary)]">RevSync Pro v2.4.1 (Build 8902)</p>
                    <div className="flex items-center justify-center gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rs-text-tertiary)]">
                        <Link to="/legal/privacy" className="hover:text-white">Privacy</Link>
                        <Link to="/legal/terms" className="hover:text-white">Terms</Link>
                        <Link to="/legal/safety-disclaimer" className="hover:text-white">Safety</Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
