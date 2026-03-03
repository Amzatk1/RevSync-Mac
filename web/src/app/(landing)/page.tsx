import Link from 'next/link';

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

export default function Home() {
    return (
        <>
            <section className="w-full max-w-[1260px] px-5 pb-10 pt-14 lg:px-8 lg:pt-20">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(18,18,27,0.95),rgba(10,10,14,0.92))] px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
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
                            <div key={metric.label} className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 backdrop-blur-sm">
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
                            className="surface-card group rounded-3xl p-6 sm:p-7"
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
                            <div key={step.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Step 0{idx + 1}</p>
                                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="trust" className="w-full max-w-[1260px] px-5 py-12 lg:px-8 lg:py-20">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="surface-card rounded-3xl p-7">
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

                    <div className="surface-card rounded-3xl p-7">
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
