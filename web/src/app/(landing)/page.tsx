import Link from 'next/link';
import { getPlatformVersions } from '@/lib/platformVersions';

const HERO_STATS = [
    { label: 'Tunes Deployed', value: '15k+' },
    { label: 'Verified Tuners', value: '420+' },
    { label: 'Avg. Safety Score', value: '97.4' },
    { label: 'Support Coverage', value: '24/7' },
];

const TRUST_MARKERS = ['Checksum Validation', 'Secure Payload Signing', 'Compatibility Scoring', 'Recovery-first Workflow'];

const FEATURE_PILLARS = [
    {
        title: 'Intelligent Marketplace Discovery',
        body: 'Search by machine profile, power goals, and safety profile with instant trust indicators for every tune listing.',
        icon: 'storefront',
    },
    {
        title: 'Controlled Flash Pipeline',
        body: 'Every flash path includes backup creation, environment checks, and guided execution steps to reduce avoidable failures.',
        icon: 'bolt',
    },
    {
        title: 'Signed & Verified Delivery',
        body: 'Tune packages pass integrity gates with signatures and hash checks before users can stage or execute any write.',
        icon: 'verified_user',
    },
    {
        title: 'Role-Based Command Surfaces',
        body: 'Riders, tuners, and admins each get interfaces optimized for their workflows across discovery, upload, and moderation.',
        icon: 'dashboard',
    },
    {
        title: 'Cross-Platform Continuity',
        body: 'Start in web, continue on mobile, and switch to desktop diagnostics with consistent account and library state.',
        icon: 'devices',
    },
    {
        title: 'Compliance & Transparency',
        body: 'Built-in legal center, safety disclaimers, and clear policy controls make high-performance tuning easier to operate responsibly.',
        icon: 'gavel',
    },
];

const WORKFLOW = [
    {
        title: 'Discover & Select',
        body: 'Filter by bike profile, tune objective, and trust score to shortlist safe candidates quickly.',
    },
    {
        title: 'Validate & Stage',
        body: 'Pair hardware, verify compatibility, and create backup snapshots before any write operation starts.',
    },
    {
        title: 'Execute & Observe',
        body: 'Run guided flashing with telemetry, status checkpoints, and failure-safe recovery paths.',
    },
    {
        title: 'Review & Iterate',
        body: 'Track outcomes, keep your tune library organized, and adjust setups through a structured release workflow.',
    },
];

const SAFETY_GATES = [
    'Ed25519 signatures to verify package authenticity',
    'SHA-256 checksums prior to execution writes',
    'Automated compatibility rules based on bike profile',
    'Recovery restore flow with backup-first policy',
];

const PRODUCT_CAPABILITIES = [
    {
        title: 'Mobile App',
        icon: 'phone_iphone',
        items: ['Garage + bike profile', 'Flash wizard + backup restore', 'On-device alerts and recovery flow'],
    },
    {
        title: 'Desktop Suite',
        icon: 'desktop_windows',
        items: ['Connection diagnostics', 'Advanced map tooling', 'Operator-grade flashing controls'],
    },
    {
        title: 'Web Cloud',
        icon: 'cloud',
        items: ['Marketplace + checkout', 'Role-based dashboards', 'Legal + account command center'],
    },
];

export default async function Home() {
    const platformVersions = await getPlatformVersions();

    return (
        <>
            <section className="w-full max-w-[1320px] px-5 pb-8 pt-12 lg:px-8 lg:pt-16">
                <div className="luxe-panel relative overflow-hidden rounded-[32px] px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                    <div className="pointer-events-none absolute inset-0 mesh-overlay opacity-50" />
                    <div className="hero-orb -top-24 left-[58%] h-72 w-72 bg-primary/30" />
                    <div className="hero-orb bottom-[-95px] left-[-20px] h-64 w-64 bg-orange-500/25" />

                    <div className="relative z-10 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="max-w-3xl animate-fade-up">
                            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/12 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                Performance Infrastructure for Modern Riders
                            </p>

                            <h1 className="text-4xl font-black leading-[1.01] text-white sm:text-6xl lg:text-7xl">
                                The command layer for <span className="text-gradient">safe, high-confidence ECU tuning</span>.
                            </h1>

                            <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                                RevSync fuses marketplace intelligence, execution safeguards, and premium operator interfaces into one system across web, mobile,
                                and desktop.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Link
                                    href="/register"
                                    className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-red-600 px-6 text-sm font-bold text-white shadow-[0_14px_34px_rgba(234,16,60,0.35)] hover:from-red-600 hover:to-primary"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    href="/marketplace"
                                    className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white hover:border-white/30"
                                >
                                    Explore Marketplace
                                </Link>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-2">
                                {TRUST_MARKERS.map((marker) => (
                                    <span key={marker} className="data-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-text-body">
                                        <span className="material-symbols-outlined text-[14px] text-emerald-300">verified</span>
                                        {marker}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="surface-card premium-hover relative overflow-hidden rounded-3xl p-5 sm:p-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
                            <div className="pointer-events-none absolute right-[-35px] top-[-35px] h-32 w-32 rounded-full bg-primary/25 blur-2xl" />
                            <div className="relative z-10">
                                <div className="mb-5 flex items-center justify-between">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Mission Control</p>
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                                        Secure
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { label: 'Compatibility Check', value: 'Passed', tone: 'text-emerald-300' },
                                        { label: 'Payload Integrity', value: 'Verified', tone: 'text-emerald-300' },
                                        { label: 'Recovery Snapshot', value: 'Ready', tone: 'text-blue-300' },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                                            <p className={`mt-1 text-sm font-bold ${item.tone}`}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Live Session Confidence</p>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-primary to-orange-400" />
                                    </div>
                                    <p className="mt-2 text-xs text-text-muted">94% risk checks validated before execution</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {HERO_STATS.map((metric, idx) => (
                            <div key={metric.label} className="data-pill rounded-2xl p-4 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                                <p className="text-2xl font-black text-white sm:text-3xl">{metric.value}</p>
                                <p className="mt-1 text-xs font-medium text-text-muted">{metric.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="features" className="w-full max-w-[1320px] px-5 py-12 lg:px-8 lg:py-16">
                <div className="mb-10 max-w-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Core Surface</p>
                    <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Premium tools built for speed, control, and trust.</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {FEATURE_PILLARS.map((feature, idx) => (
                        <article
                            key={feature.title}
                            className="surface-card premium-hover rounded-3xl p-6 sm:p-7 animate-fade-up"
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

            <section id="workflow" className="w-full max-w-[1320px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="luxe-panel relative overflow-hidden rounded-[30px] p-6 sm:p-9">
                    <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.18]" />
                    <div className="relative z-10 mb-8 max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Execution Flow</p>
                        <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">From tune discovery to validated flash in a controlled loop.</h2>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {WORKFLOW.map((step, idx) => (
                            <div key={step.title} className="premium-hover rounded-2xl border border-white/10 bg-white/[0.03] p-5 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Step {idx + 1}</p>
                                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="platforms" className="w-full max-w-[1320px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="mb-10 max-w-3xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Platform Status</p>
                    <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Version-aware across mobile, desktop, and web.</h2>
                    <p className="mt-3 text-sm leading-relaxed text-text-muted">
                        Versions are read directly from workspace manifests to keep release communication transparent for users and teams.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {platformVersions.map((platform, idx) => (
                        <article key={platform.name} className="surface-card premium-hover rounded-3xl p-6 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
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

            <section id="trust" className="w-full max-w-[1320px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="surface-card rounded-3xl p-7 animate-fade-up">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Trust Protocol</p>
                        <h3 className="text-2xl font-black text-white">Execution gates designed for safety-first operations.</h3>
                        <div className="mt-5 space-y-3">
                            {SAFETY_GATES.map((item) => (
                                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
                                    <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
                                    <span className="text-sm text-text-body">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="surface-card rounded-3xl p-7 animate-fade-up" style={{ animationDelay: '70ms' }}>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Start Today</p>
                        <h3 className="text-2xl font-black text-white">Upgrade your tuning workflow with confidence.</h3>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            Whether your goal is lap-time consistency, stronger throttle response, or safer baseline maps, RevSync provides a modern command center for
                            every flash.
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
