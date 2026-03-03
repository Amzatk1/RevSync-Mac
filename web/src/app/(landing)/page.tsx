import Link from 'next/link';
import { getPlatformVersions } from '@/lib/platformVersions';

const METRICS = [
    { label: 'Tunes Deployed', value: '15k+' },
    { label: 'Verified Tuners', value: '420+' },
    { label: 'Avg. Safety Score', value: '97.4' },
    { label: 'Support Coverage', value: '24/7' },
];

const FEATURE_ROWS = [
    {
        title: 'Curated Marketplace',
        body: 'Browse stage-specific tunes by bike profile, dyno gains, safety score, and creator credibility in seconds.',
        icon: 'storefront',
    },
    {
        title: 'Integrity by Default',
        body: 'Every tune package is signed, hashed, and validated before it reaches your ECU. No guesswork, no blind flashes.',
        icon: 'verified_user',
    },
    {
        title: 'Guided Flash Execution',
        body: 'Streamlined steps, device health checks, backup creation, and recovery pathways built into every flash flow.',
        icon: 'bolt',
    },
    {
        title: 'Role-Tuned Experience',
        body: 'Riders, tuners, and admins each get purpose-built interfaces for discovery, publishing, and quality control.',
        icon: 'tune',
    },
];

const STEPS = [
    {
        title: 'Select your tune',
        body: 'Filter by machine setup, goals, and trust signal. Preview gains before purchase.',
    },
    {
        title: 'Validate and pair',
        body: 'Connect your device, run compatibility checks, and stage your backup safely.',
    },
    {
        title: 'Flash and monitor',
        body: 'Execute with live progress, status telemetry, and post-flash performance summary.',
    },
];

const PRODUCT_CAPABILITIES = [
    {
        title: 'Mobile Pipeline',
        icon: 'phone_iphone',
        items: ['Garage + bike profile', 'Flash wizard + recovery', 'Safety and legal acceptance flow'],
    },
    {
        title: 'Desktop Operations',
        icon: 'desktop_windows',
        items: ['Workbench + connection manager', 'Map editor + diagnostics', 'Batch queue + recovery tooling'],
    },
    {
        title: 'Web Cloud',
        icon: 'cloud',
        items: ['Marketplace + purchasing', 'Role-based dashboards', 'Legal and policy center'],
    },
];

export default async function Home() {
    const platformVersions = await getPlatformVersions();

    return (
        <>
            <section className="w-full max-w-[1260px] px-5 pb-10 pt-14 lg:px-8 lg:pt-20">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(18,18,27,0.95),rgba(10,10,14,0.92))] px-6 py-10 sm:px-10 sm:py-14 lg:px-14 animate-fade-up">
                    <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.22]" />
                    <div className="hero-orb -top-24 right-16 h-72 w-72 bg-primary/30" />
                    <div className="hero-orb bottom-[-80px] left-12 h-64 w-64 bg-orange-500/20" />

                    <div className="relative z-10 max-w-3xl">
                        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/12 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                            <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
                            New Generation Tuning Platform
                        </p>

                        <h1 className="text-4xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                            Performance tuning that feels <span className="text-gradient">premium, controlled, and safe</span>.
                        </h1>

                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                            RevSync brings marketplace discovery, secure purchases, and ECU flash execution into one high-velocity workflow inspired by elite software products.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link
                                href="/register"
                                className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-red-600 px-6 text-sm font-bold text-white shadow-[0_10px_32px_rgba(234,16,60,0.38)] hover:from-red-600 hover:to-primary"
                            >
                                Create Account
                            </Link>
                            <Link
                                href="/marketplace"
                                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-6 text-sm font-semibold text-white hover:border-white/30"
                            >
                                Explore Marketplace
                            </Link>
                        </div>
                    </div>

                    <div className="relative z-10 mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {METRICS.map((metric) => (
                            <div key={metric.label} className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 backdrop-blur-sm animate-fade-up">
                                <p className="text-2xl font-black text-white sm:text-3xl">{metric.value}</p>
                                <p className="mt-1 text-xs font-medium text-text-muted">{metric.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="features" className="w-full max-w-[1260px] px-5 py-12 lg:px-8 lg:py-16">
                <div className="mb-10 max-w-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Features</p>
                    <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">A complete product surface, not just a tune store.</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {FEATURE_ROWS.map((feature, idx) => (
                        <article
                            key={feature.title}
                            className="surface-card group rounded-3xl p-6 sm:p-7 animate-fade-up"
                            style={{ animationDelay: `${idx * 70}ms` }}
                        >
                            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/12 text-primary">
                                <span className="material-symbols-outlined text-[22px]">{feature.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-text-muted">{feature.body}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="workflow" className="w-full max-w-[1260px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(16,16,24,0.88),rgba(9,9,14,0.82))] p-6 sm:p-10">
                    <div className="mb-9 max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Workflow</p>
                        <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">From browse to flash in 3 controlled steps.</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {STEPS.map((step, idx) => (
                            <div key={step.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Step 0{idx + 1}</p>
                                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="platforms" className="w-full max-w-[1260px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="mb-10 max-w-3xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Platform Status</p>
                    <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Version-aware across mobile, desktop, and web.</h2>
                    <p className="mt-3 text-sm leading-relaxed text-text-muted">
                        These versions are read from the repository package manifests so users can track what is live and what is still in active development.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {platformVersions.map((platform, idx) => (
                        <article key={platform.name} className="surface-card rounded-3xl p-6 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                                <span
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                                        platform.status === 'active'
                                            ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                                            : 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                                    }`}
                                >
                                    {platform.status}
                                </span>
                            </div>
                            <p className="text-sm text-text-muted">
                                Version <span className="font-bold text-white">v{platform.version}</span>
                            </p>
                            <div className="mt-4 space-y-2">
                                {platform.highlights.map((item) => (
                                    <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                                        <span className="text-xs text-text-body">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {PRODUCT_CAPABILITIES.map((capability, idx) => (
                        <article key={capability.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 animate-fade-up" style={{ animationDelay: `${idx * 90}ms` }}>
                            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                                <span className="material-symbols-outlined text-[18px]">{capability.icon}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">{capability.title}</h3>
                            <div className="mt-3 space-y-2">
                                {capability.items.map((item) => (
                                    <p key={item} className="text-sm text-text-muted">
                                        • {item}
                                    </p>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section id="trust" className="w-full max-w-[1260px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="surface-card rounded-3xl p-7 animate-fade-up">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Security Model</p>
                        <h3 className="text-2xl font-black text-white">Built with trust-first execution gates.</h3>
                        <div className="mt-5 space-y-3">
                            {['Ed25519 signatures for payload authenticity', 'SHA-256 checksum validation before write', 'Safety scoring and compatibility indexing'].map((item) => (
                                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
                                    <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
                                    <span className="text-sm text-text-body">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="surface-card rounded-3xl p-7 animate-fade-up" style={{ animationDelay: '70ms' }}>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Start Today</p>
                        <h3 className="text-2xl font-black text-white">Push your machine further with confidence.</h3>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            Whether you are chasing lap time, sharper throttle response, or a safer baseline map, RevSync gives you a modern control center for every flash.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/register"
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-red-600 px-5 text-sm font-bold text-white"
                            >
                                Get Started
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-5 text-sm font-semibold text-white"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
