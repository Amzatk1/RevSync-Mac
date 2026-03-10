'use client';

import { useState, useEffect, type FormEvent } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import type { PaginatedResponse, UserPreference } from '@/lib/types';

interface ProfileData {
    bio: string;
    country: string;
    experience_level: string;
    riding_style: string;
    risk_tolerance: string;
}

interface NotificationSettings {
    recommendations: boolean;
    flashUpdates: boolean;
    community: boolean;
}

const COUNTRY_OPTIONS = [
    { value: 'UK', label: 'United Kingdom' },
    { value: 'EU', label: 'European Union' },
    { value: 'US', label: 'United States' },
    { value: 'ROW', label: 'Rest of World' },
] as const;

const EXPERIENCE_OPTIONS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
] as const;

const RIDING_STYLE_OPTIONS = [
    { value: 'casual', label: 'Casual Cruising' },
    { value: 'commuting', label: 'Commuting' },
    { value: 'sport', label: 'Sport Riding' },
    { value: 'touring', label: 'Long Distance' },
    { value: 'track', label: 'Track Focused' },
    { value: 'offroad', label: 'Adventure / Off-road' },
] as const;

const RISK_TOLERANCE_OPTIONS = [
    { value: 'conservative', label: 'Conservative', description: 'Prioritize reliability and lower stress maps.' },
    { value: 'balanced', label: 'Balanced', description: 'Performance with controlled safety margins.' },
    { value: 'aggressive', label: 'Aggressive', description: 'Higher-performance setup with tighter margins.' },
] as const;

const PREFERENCE_KEYS = {
    recommendations: 'notifications_recommendations',
    flashUpdates: 'notifications_flash_updates',
    community: 'notifications_community',
} as const;

function parsePreferenceBool(value: unknown, fallback = true): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (value && typeof value === 'object' && 'enabled' in value) {
        const enabled = (value as { enabled?: unknown }).enabled;
        if (typeof enabled === 'boolean') return enabled;
    }
    return fallback;
}

function OptionGroup({
    label,
    value,
    options,
    onSelect,
    multiColumn = false,
}: {
    label: string;
    value: string;
    options: readonly { value: string; label: string }[];
    onSelect: (value: string) => void;
    multiColumn?: boolean;
}) {
    return (
        <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{label}</label>
            <div className={`grid gap-2 ${multiColumn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {options.map((option) => {
                    const isActive = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onSelect(option.value)}
                            className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-all ${
                                isActive
                                    ? 'border-sky-400/35 bg-sky-400/10 text-white shadow-[0_0_24px_rgba(99,199,255,0.12)]'
                                    : 'border-white/12 bg-white/[0.02] text-text-muted hover:border-white/25 hover:text-white'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [form, setForm] = useState<ProfileData>({
        bio: '',
        country: 'US',
        experience_level: 'intermediate',
        riding_style: 'sport',
        risk_tolerance: 'balanced',
    });
    const [notifications, setNotifications] = useState<NotificationSettings>({
        recommendations: true,
        flashUpdates: true,
        community: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const setField = (key: keyof ProfileData, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    useEffect(() => {
        (async () => {
            try {
                const [profile, prefs] = await Promise.all([
                    api.get<ProfileData>('/v1/profile/me/'),
                    api.get<PaginatedResponse<UserPreference>>('/v1/preferences/'),
                ]);

                setForm((prev) => ({
                    ...prev,
                    bio: profile.bio || '',
                    country: profile.country || prev.country,
                    experience_level: profile.experience_level || prev.experience_level,
                    riding_style: profile.riding_style || prev.riding_style,
                    risk_tolerance: profile.risk_tolerance || prev.risk_tolerance,
                }));

                const map = new Map(prefs.results.map((item) => [item.key, item.value]));
                setNotifications({
                    recommendations: parsePreferenceBool(map.get(PREFERENCE_KEYS.recommendations), true),
                    flashUpdates: parsePreferenceBool(map.get(PREFERENCE_KEYS.flashUpdates), true),
                    community: parsePreferenceBool(map.get(PREFERENCE_KEYS.community), true),
                });
            } catch {
                // keep defaults if backend values are unavailable
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await Promise.all([
                api.patch('/v1/profile/me/', form),
                api.post('/v1/preferences/', { key: PREFERENCE_KEYS.recommendations, value: notifications.recommendations }),
                api.post('/v1/preferences/', { key: PREFERENCE_KEYS.flashUpdates, value: notifications.flashUpdates }),
                api.post('/v1/preferences/', { key: PREFERENCE_KEYS.community, value: notifications.community }),
            ]);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // no-op for now
        } finally {
            setSaving(false);
        }
    };

    const riskMeta = RISK_TOLERANCE_OPTIONS.find((option) => option.value === form.risk_tolerance);

    return (
        <AppLayout title="Settings" subtitle="Manage profile, safety preferences, and notification controls">
            <form onSubmit={handleSave} className="grid grid-cols-1 gap-5 2xl:grid-cols-12">
                <section className="space-y-5 2xl:col-span-8">
                    <article className="app-panel-raised rounded-[30px] p-5 sm:p-6 animate-fade-up">
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
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">{user?.role}</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="h-12 rounded-xl skeleton-shimmer" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Bio</label>
                                    <textarea
                                        value={form.bio}
                                        onChange={(e) => setField('bio', e.target.value)}
                                        placeholder="Share your build goals and riding profile"
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-text-muted/60 focus:border-sky-400/45 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <OptionGroup
                                        label="Country"
                                        value={form.country}
                                        options={COUNTRY_OPTIONS}
                                        onSelect={(value) => setField('country', value)}
                                        multiColumn
                                    />

                                    <OptionGroup
                                        label="Experience"
                                        value={form.experience_level}
                                        options={EXPERIENCE_OPTIONS}
                                        onSelect={(value) => setField('experience_level', value)}
                                    />
                                </div>

                                <OptionGroup
                                    label="Riding Style"
                                    value={form.riding_style}
                                    options={RIDING_STYLE_OPTIONS}
                                    onSelect={(value) => setField('riding_style', value)}
                                    multiColumn
                                />

                                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[18px] text-amber-300">warning</span>
                                        <div>
                                            <p className="text-sm font-bold text-amber-200">Risk Tolerance Declaration</p>
                                            <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
                                                Be truthful about your real tolerance for aggressive tunes. This directly affects safety guidance,
                                                tune recommendations, and how much margin the platform should preserve for your own protection.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Risk Tolerance</label>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        {RISK_TOLERANCE_OPTIONS.map((option) => {
                                            const isActive = form.risk_tolerance === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setField('risk_tolerance', option.value)}
                                                    className={`rounded-xl border px-3.5 py-3 text-left transition-all ${
                                                        isActive
                                                            ? 'border-sky-400/35 bg-sky-400/10 text-white shadow-[0_0_24px_rgba(99,199,255,0.12)]'
                                                            : 'border-white/12 bg-white/[0.02] text-text-muted hover:border-white/25 hover:text-white'
                                                    }`}
                                                >
                                                    <p className="text-sm font-bold">{option.label}</p>
                                                    <p className="mt-1 text-xs text-current/80">{option.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {riskMeta && <p className="mt-2 text-xs text-text-muted">Current profile bias: {riskMeta.label}</p>}
                                </div>
                            </div>
                        )}
                    </article>

                    <article className="app-panel rounded-[30px] p-5 sm:p-6 animate-fade-up" style={{ animationDelay: '70ms' }}>
                        <h3 className="mb-4 text-xl font-black text-white">Notifications</h3>
                        <div className="space-y-3">
                            {[
                                {
                                    key: 'recommendations' as const,
                                    label: 'New tune recommendations',
                                    desc: 'Get notified about tunes matching your bike setup.',
                                },
                                {
                                    key: 'flashUpdates' as const,
                                    label: 'Flash job updates',
                                    desc: 'Progress and completion alerts for active jobs.',
                                },
                                {
                                    key: 'community' as const,
                                    label: 'Community activity',
                                    desc: 'Mentions, replies, and tuner updates.',
                                },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.label}</p>
                                        <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications[item.key]}
                                            onChange={(e) =>
                                                setNotifications((prev) => ({
                                                    ...prev,
                                                    [item.key]: e.target.checked,
                                                }))
                                            }
                                            className="peer sr-only"
                                        />
                                        <div className="h-5 w-10 rounded-full bg-white/20 after:absolute after:start-[2px] after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-sky-400/70 peer-checked:after:translate-x-5" />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>

                <aside className="space-y-5 2xl:col-span-4">
                    <article className="app-panel rounded-[30px] p-5 sm:p-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">Save Status</p>
                        <h3 className="text-xl font-black text-white">Apply Changes</h3>
                        <p className="mt-2 text-sm text-text-muted">Saves profile fields and notification preferences to backend.</p>

                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="rs-button-primary mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Save All Changes'}
                        </button>

                        {saved && (
                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Profile and preferences saved
                            </div>
                        )}
                    </article>

                    <article className="app-panel rounded-[30px] p-5 sm:p-6 animate-fade-up" style={{ animationDelay: '170ms' }}>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">Account Security</p>
                        <h3 className="text-xl font-black text-white">Danger Zone</h3>
                        <p className="mt-2 text-sm text-text-muted">High-impact account actions. Continue with caution.</p>
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                            }}
                            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 px-5 text-sm font-bold text-red-300 hover:bg-red-500/20"
                        >
                            Sign Out Everywhere
                        </button>
                    </article>
                </aside>
            </form>
        </AppLayout>
    );
}
