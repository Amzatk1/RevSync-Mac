import { Link, useParams } from 'react-router-dom';
import { LEGAL_DOCS, LEGAL_DOC_ORDER, type LegalDocKey } from '../lib/legalContent';

function resolveDocKey(value: string | undefined): LegalDocKey {
    if (value === 'terms' || value === 'privacy' || value === 'safety-disclaimer') {
        return value;
    }
    return 'privacy';
}

export default function LegalPage() {
    const { docKey } = useParams();
    const activeKey = resolveDocKey(docKey);
    const doc = LEGAL_DOCS[activeKey];

    return (
        <div className="rs-shell min-h-screen overflow-y-auto">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
                <div className="flex items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="rs-section-label m-0">Legal Workspace</p>
                        <h1 className="mt-2 text-3xl font-black text-[var(--rs-text-primary)]">{doc.title}</h1>
                        <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">
                            Policy content used across RevSync desktop, mobile, and public web surfaces. Review history and routing stay explicit so operators always know which policy they are reading.
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--rs-text-tertiary)]">Last updated {doc.lastUpdated}</p>
                    </div>
                    <Link to="/login" className="rs-button-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
                        <span className="material-symbols-outlined text-base">login</span>
                        Sign In
                    </Link>
                </div>

                <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-6">
                    <aside className="rs-panel rounded-[22px] p-4">
                        <p className="rs-section-label m-0">Documents</p>
                        <div className="mt-4 space-y-2">
                            {LEGAL_DOC_ORDER.map((key) => {
                                const item = LEGAL_DOCS[key];
                                const isActive = key === activeKey;
                                return (
                                    <Link
                                        key={key}
                                        to={`/legal/${key}`}
                                        className={`block rounded-[16px] border px-4 py-3 transition-colors ${
                                            isActive
                                                ? 'border-[var(--rs-accent)]/30 bg-[var(--rs-accent)]/10 text-[var(--rs-text-primary)]'
                                                : 'border-[var(--rs-stroke-soft)] bg-white/[0.02] text-[var(--rs-text-secondary)] hover:border-[var(--rs-stroke-strong)] hover:text-[var(--rs-text-primary)]'
                                        }`}
                                    >
                                        <p className="text-sm font-semibold">{item.title}</p>
                                        <p className="mt-1 text-xs text-[var(--rs-text-tertiary)]">Mirrored policy for all RevSync product surfaces.</p>
                                    </Link>
                                );
                            })}
                        </div>
                    </aside>

                    <article className="rs-panel-raised rounded-[24px] p-6">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="rs-section-label m-0">Policy Text</p>
                                <p className="mt-2 text-sm text-[var(--rs-text-secondary)]">
                                    This view is intentionally plain so operators can read dense legal material without dashboard-like noise.
                                </p>
                            </div>
                            <span className="rs-badge border-[var(--rs-stroke-soft)] bg-white/[0.04] text-[var(--rs-text-secondary)]">
                                <span className="material-symbols-outlined text-sm">gavel</span>
                                Legal Reference
                            </span>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--rs-text-secondary)]">{doc.content}</pre>
                    </article>
                </div>
            </div>
        </div>
    );
}
