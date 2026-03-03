'use client';

import { useState, useEffect, type FormEvent } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface ProfileData {
    bio: string;
    country: string;
    experience_level: string;
    riding_style: string;
    risk_tolerance: string;
}

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [form, setForm] = useState<ProfileData>({
        bio: '',
        country: '',
        experience_level: '',
        riding_style: '',
        risk_tolerance: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<ProfileData>('/v1/profile/me/');
                setForm(res);
            } catch {
                // empty fallback
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await api.patch('/v1/profile/me/', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // no-op
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout title="Settings" subtitle="Manage profile data, alerts, and account controls">
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-12">
                <section className="space-y-5 2xl:col-span-8">
                    <article className="surface-card rounded-3xl p-5 sm:p-6">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-text-muted">
                                {user?.profile?.photo_url ? (
                                    <img src={user.profile.photo_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-3xl">person</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">
                                    {user?.first_name || user?.username || 'User'} {user?.last_name || ''}
                                </h2>
                                <p className="text-sm text-text-muted">{user?.email}</p>
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{user?.role}</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-12 rounded-xl skeleton-shimmer" />
                                ))}
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Bio</label>
                                    <textarea
                                        value={form.bio}
                                        onChange={(e) => set('bio', e.target.value)}
                                        placeholder="Tell us about your riding profile"
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {[
                                        { key: 'country', label: 'Country', placeholder: 'US' },
                                        { key: 'experience_level', label: 'Experience', placeholder: 'intermediate' },
                                        { key: 'riding_style', label: 'Riding Style', placeholder: 'sport' },
                                        { key: 'risk_tolerance', label: 'Risk Tolerance', placeholder: 'moderate' },
                                    ].map((field) => (
                                        <div key={field.key}>
                                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                                                {field.label}
                                            </label>
                                            <input
                                                type="text"
                                                value={form[field.key as keyof ProfileData]}
                                                onChange={(e) => set(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-red-600 px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                    {saved && (
                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                            Saved
                                        </span>
                                    )}
                                </div>
                            </form>
                        )}
                    </article>

                    <article className="surface-card rounded-3xl p-5 sm:p-6">
                        <h3 className="mb-4 text-xl font-black text-white">Notifications</h3>
                        <div className="space-y-3">
                            {[
                                {
                                    label: 'New tune recommendations',
                                    desc: 'Get notified about tunes matching your bike setup.',
                                },
                                {
                                    label: 'Flash job updates',
                                    desc: 'Progress and completion alerts for active jobs.',
                                },
                                {
                                    label: 'Community activity',
                                    desc: 'Mentions, replies, and tuner updates.',
                                },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.label}</p>
                                        <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer">
                                        <input type="checkbox" defaultChecked className="peer sr-only" />
                                        <div className="h-5 w-10 rounded-full bg-white/20 after:absolute after:start-[2px] after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary/70 peer-checked:after:translate-x-5" />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>

                <aside className="space-y-5 2xl:col-span-4">
                    <article className="surface-card rounded-3xl p-5 sm:p-6">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Account Security</p>
                        <h3 className="text-xl font-black text-white">Danger Zone</h3>
                        <p className="mt-2 text-sm text-text-muted">High-impact account actions. Continue with caution.</p>
                        <button
                            onClick={() => {
                                logout();
                            }}
                            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 px-5 text-sm font-bold text-red-300 hover:bg-red-500/20"
                        >
                            Sign Out Everywhere
                        </button>
                    </article>
                </aside>
            </div>
        </AppLayout>
    );
}
