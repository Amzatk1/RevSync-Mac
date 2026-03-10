import Link from 'next/link';
import { getPlatformVersions } from '@/lib/platformVersions';

const HERO_STATS = [
    { label: 'Tunes Deployed', value: '15k+' },
    { label: 'Verified Tuners', value: '420+' },
    { label: 'Avg. Safety Score', value: '97.4' },
    { label: 'Recovery Preparedness', value: '94%' },
];

const TRUST_MARKERS = ['Checksum validation', 'Signed tune packages', 'Compatibility scoring', 'Backup-first flashing'];

const FEATURE_PILLARS = [
    {
        title: 'Marketplace intelligence',
        body: 'Browse by machine profile, tune objective, and trust profile with deterministic compatibility indicators attached to every listing.',
        icon: 'storefront',
    },
    {
        title: 'Controlled flash execution',
        body: 'Every write path is gated by entitlement checks, hardware readiness, backup creation, and clear operator checkpoints.',
        icon: 'bolt',
    },
    {
        title: 'Desktop-grade tooling',
        body: 'RevSync Pro gives tuners and workshops a true multi-panel workspace for validation, publishing, diagnostics, and release control.',
        icon: 'desktop_windows',
    },
    {
        title: 'Mobile guidance layer',
        body: 'RevSync Mobile turns complex flashing into a calm step-by-step flow with explicit warnings, verification states, and recovery options.',
        icon: 'phone_iphone',
    },
    {
        title: 'Signed delivery pipeline',
        body: 'Packages move through quarantine, approval, and signature stages before customers can stage or execute them.',
        icon: 'verified_user',
    },
    {
        title: 'Operator trust surfaces',
        body: 'Severity-led validation, compatibility reports, and release metadata keep risky actions visible without adding visual noise.',
        icon: 'shield_lock',
    },
];

const WORKFLOW = [
    {
        title: 'Discover and shortlist',
        body: 'Use trust signals, fitment constraints, and tune intent to narrow the field before any purchase or staging action.',
    },
    {
        title: 'Validate and prepare',
        body: 'Confirm entitlement, identify the ECU, capture a safe backup, and verify device readiness through explicit gates.',
    },
    {
        title: 'Flash with control',
        body: 'Move through a guided execution sequence with stable status feedback, reduced motion, and no ambiguous action states.',
    },
    {
        title: 'Review and iterate',
        body: 'Track results, manage versions, publish updates, and keep a signed release history across customer and tuner workflows.',
    },
];

const SAFETY_GATES = [
    'Ed25519 signatures verify package authenticity before staging',
    'SHA-256 hashes validate tune and package integrity before write',
    'Compatibility rules check fitment against the target vehicle profile',
    'Recovery mode remains available through a backup-first execution policy',
];

const PRODUCT_CAPABILITIES = [
    {
        title: 'RevSync Mobile',
        icon: 'phone_iphone',
        items: ['Garage and vehicle profile', 'Backup and flash wizard', 'Verification and guided recovery'],
    },
    {
        title: 'RevSync Pro',
        icon: 'desktop_windows',
        items: ['Project workspace and map review', 'Validation, signing, and publish flows', 'Diagnostics, logs, and operator tools'],
    },
    {
        title: 'RevSync Web',
        icon: 'language',
        items: ['Public marketplace browsing', 'Account, download, and entitlement visibility', 'Documentation, legal, and release communication'],
    },
];

const controlChecks = [
    { label: 'Package signature', value: 'Verified', tone: 'text-emerald-300' },
    { label: 'Fitment confidence', value: 'Matched vehicle profile', tone: 'text-sky-300' },
    { label: 'Recovery readiness', value: 'Backup required before write', tone: 'text-text-body' },
];

export default async function Home() {
    const platformVersions = await getPlatformVersions();

    return (
        <>
            <section className="w-full max-w-[1320px] px-5 pb-10 pt-12 lg:px-8 lg:pt-16">
                <div className="luxe-panel relative overflow-hidden rounded-[34px] px-6 py-7 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
                    <div className="pointer-events-none absolute inset-0 mesh-overlay opacity-40" />
                    <div className="hero-orb -top-28 right-[6%] h-72 w-72 bg-sky-400/18" />
                    <div className="hero-orb bottom-[-110px] left-[-10px] h-64 w-64 bg-primary/16" />

                    <div className="relative z-10 grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                        <div className="max-w-3xl animate-fade-up">
                            <p className="rs-status-chip mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                                <span className="material-symbols-outlined text-[14px] text-sky-300">tune</span>
                                Premium control for safety-critical ECU workflows
                            </p>

                            <h1 className="text-4xl font-black leading-[0.99] text-white sm:text-6xl lg:text-7xl">
                                The workbench for <span className="text-gradient">safe, high-confidence tuning operations</span>.
                            </h1>

                            <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                                RevSync combines signed marketplace delivery, guided flash execution, and desktop-grade validation into one system across mobile,
                                desktop, and web.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Link href="/register" className="rs-button-primary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-bold">
                                    Create Account
                                </Link>
                                <Link href="/downloads" className="rs-button-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
                                    Download Clients
                                </Link>
                                <Link href="/marketplace" className="inline-flex h-12 items-center justify-center rounded-xl px-2 text-sm font-semibold text-text-muted hover:text-white">
                                    Explore Marketplace
                                </Link>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-2">
                                {TRUST_MARKERS.map((marker) => (
                                    <span key={marker} className="rs-status-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-text-body">
                                        <span className="material-symbols-outlined text-[14px] text-emerald-300">verified</span>
                                        {marker}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="app-panel-raised premium-hover relative overflow-hidden rounded-[28px] p-5 sm:p-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
                            <div className="pointer-events-none absolute right-[-35px] top-[-35px] h-32 w-32 rounded-full bg-sky-400/12 blur-2xl" />
                            <div className="relative z-10">
                                <div className="mb-5 flex items-center justify-between">
                                    <div>
                                        <p className="section-kicker">Execution Control</p>
                                        <p className="mt-1 text-sm text-text-muted">Pre-write state for Yamaha R1 2021</p>
                                    </div>
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                                        Ready
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {controlChecks.map((item) => (
                                        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                                            <p className={`mt-1 text-sm font-bold ${item.tone}`}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Validation stack</p>
                                        <p className="mt-2 text-lg font-bold text-white">18 of 18 checks passed</p>
                                        <p className="mt-1 text-xs text-text-muted">Signature, fitment, entitlement, and hardware readiness complete.</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Operator action</p>
                                        <p className="mt-2 text-lg font-bold text-white">Backup required</p>
                                        <p className="mt-1 text-xs text-text-muted">Fail-closed workflow prevents write until snapshot is stored.</p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                                        <span>System confidence</span>
                                        <span className="text-white">94%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-sky-400 via-sky-300 to-primary" />
                                    </div>
                                    <p className="mt-2 text-xs text-text-muted">Confidence reflects safety checks, recovery availability, and tune verification state.</p>
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
                <div className="mb-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
                    <div className="max-w-2xl">
                        <p className="section-kicker">Core Surfaces</p>
                        <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Premium tools built for clarity, control, and operator trust.</h2>
                    </div>
                    <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
                        The system is designed like serious workstation software: dense where it needs to be, restrained in motion, and explicit around anything that
                        can affect flashing safety.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {FEATURE_PILLARS.map((feature, idx) => (
                        <article key={feature.title} className="app-panel premium-hover rounded-[28px] p-6 sm:p-7 animate-fade-up" style={{ animationDelay: `${idx * 70}ms` }}>
                            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                                <span className="material-symbols-outlined text-[22px]">{feature.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-text-muted">{feature.body}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="workflow" className="w-full max-w-[1320px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="app-panel-raised relative overflow-hidden rounded-[30px] p-6 sm:p-9">
                    <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.14]" />
                    <div className="relative z-10 mb-8 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                        <div className="max-w-2xl">
                            <p className="section-kicker">Execution Flow</p>
                            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">From shortlist to signed delivery and controlled flash.</h2>
                        </div>
                        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
                            RevSync keeps the path deterministic: no decorative success theatrics, no ambiguous warnings, and no write without the necessary backups,
                            validation state, and operator confirmation.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {WORKFLOW.map((step, idx) => (
                            <div key={step.title} className="premium-hover rounded-2xl border border-white/10 bg-white/[0.03] p-5 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">Step {idx + 1}</p>
                                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="platforms" className="w-full max-w-[1320px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="mb-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
                    <div className="max-w-3xl">
                        <p className="section-kicker">Platform Status</p>
                        <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">One product language across mobile, desktop, and web.</h2>
                    </div>
                    <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
                        Release visibility is pulled from the workspace itself so the public surface reflects actual platform state instead of static marketing copy.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {platformVersions.map((platform, idx) => (
                        <article key={platform.name} className="app-panel premium-hover rounded-[28px] p-6 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                                <span
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                                        platform.status === 'active'
                                            ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300'
                                            : 'border-amber-400/30 bg-amber-500/12 text-amber-300'
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
                                        <span className="material-symbols-outlined text-[16px] text-sky-300">check_circle</span>
                                        <span className="text-xs text-text-body">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {PRODUCT_CAPABILITIES.map((capability, idx) => (
                        <article key={capability.title} className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 animate-fade-up" style={{ animationDelay: `${idx * 90}ms` }}>
                            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
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
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="app-panel rounded-[28px] p-7 animate-fade-up">
                        <p className="section-kicker mb-3">Trust Protocol</p>
                        <h3 className="text-2xl font-black text-white">Execution gates are visible, explicit, and fail-closed.</h3>
                        <div className="mt-5 space-y-3">
                            {SAFETY_GATES.map((item) => (
                                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
                                    <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
                                    <span className="text-sm text-text-body">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="app-panel-raised rounded-[28px] p-7 animate-fade-up" style={{ animationDelay: '70ms' }}>
                        <p className="section-kicker mb-3">Next Step</p>
                        <h3 className="text-2xl font-black text-white">Start with the surface that matches your workflow.</h3>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            Riders can move through a guided mobile-first flash path, tuners can operate from RevSync Pro, and teams can manage entitlements, releases,
                            and downloads from the web layer.
                        </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <Link href="/downloads" className="rs-button-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold">
                                Open Downloads
                            </Link>
                            <Link href="/marketplace" className="rs-button-secondary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold">
                                Browse Marketplace
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
