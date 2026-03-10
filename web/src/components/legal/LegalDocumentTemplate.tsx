import Link from 'next/link';
import type { LegalDoc } from '@/lib/legalContent';

export default function LegalDocumentTemplate({ doc }: { doc: LegalDoc }) {
    return (
        <div className="app-shell relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.08]" />
            <div className="hero-orb -top-28 left-[-110px] h-[360px] w-[360px] bg-sky-400/14" />
            <div className="hero-orb bottom-[-170px] right-[-130px] h-[420px] w-[420px] bg-primary/16" />

            <div className="relative z-10 mx-auto w-full max-w-[960px] px-5 py-10 sm:py-14">
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                    <Link href="/" className="hover:text-primary">
                        Home
                    </Link>
                    <span className="material-symbols-outlined text-[14px] text-text-muted/60">chevron_right</span>
                    <Link href="/legal" className="hover:text-primary">
                        Legal
                    </Link>
                    <span className="material-symbols-outlined text-[14px] text-text-muted/60">chevron_right</span>
                    <span className="text-white">{doc.title}</span>
                </div>

                <article className="app-panel-raised rounded-3xl p-6 sm:p-8">
                    <p className="rs-status-chip mb-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
                        Legal Document
                    </p>
                    <h1 className="text-3xl font-black text-white sm:text-4xl">{doc.title}</h1>
                    <p className="mt-2 text-sm text-text-muted">Last updated: {doc.lastUpdated}</p>

                    <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                        <pre className="whitespace-pre-wrap font-body text-sm leading-7 text-text-body">{doc.content}</pre>
                    </div>
                </article>
            </div>
        </div>
    );
}
