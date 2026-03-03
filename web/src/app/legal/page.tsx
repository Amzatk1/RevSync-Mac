import Link from 'next/link';
import { LEGAL_DOC_ORDER, LEGAL_DOCS } from '@/lib/legalContent';

export default function LegalIndexPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background-dark">
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.12]" />
            <div className="hero-orb -top-28 left-[-110px] h-[360px] w-[360px] bg-primary/28" />
            <div className="hero-orb bottom-[-170px] right-[-130px] h-[420px] w-[420px] bg-orange-500/20" />

            <div className="relative z-10 mx-auto w-full max-w-[960px] px-5 py-10 sm:py-14">
                <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
                    <Link href="/" className="hover:text-primary">
                        Home
                    </Link>
                    <span className="material-symbols-outlined text-[14px] text-text-muted/60">chevron_right</span>
                    <span className="text-white">Legal</span>
                </div>

                <section className="surface-card rounded-3xl p-6 sm:p-8">
                    <p className="mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                        Legal Center
                    </p>
                    <h1 className="text-3xl font-black text-white sm:text-4xl">Legal & Compliance Documents</h1>
                    <p className="mt-2 text-sm text-text-muted">These policies are mirrored from the mobile app legal section.</p>

                    <div className="mt-7 grid grid-cols-1 gap-3">
                        {LEGAL_DOC_ORDER.map((key) => {
                            const doc = LEGAL_DOCS[key];
                            return (
                                <Link
                                    key={doc.key}
                                    href={`/legal/${doc.key}`}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 hover:border-primary/35 hover:bg-primary/10"
                                >
                                    <div>
                                        <p className="text-base font-bold text-white">{doc.title}</p>
                                        <p className="text-xs text-text-muted">Last updated {doc.lastUpdated}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-text-muted">arrow_forward</span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
