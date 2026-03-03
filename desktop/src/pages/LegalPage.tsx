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
        <div className="h-full min-h-screen bg-bg-dark overflow-y-auto">
            <div className="absolute inset-0 dot-grid pointer-events-none" />
            <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Legal</p>
                        <h1 className="text-3xl font-black text-white mt-1">{doc.title}</h1>
                        <p className="text-sm text-text-muted mt-1">Last updated: {doc.lastUpdated}</p>
                    </div>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 rounded-lg border border-border-dark bg-panel-dark px-3 py-2 text-xs font-semibold text-text-muted hover:text-white"
                    >
                        <span className="material-symbols-outlined text-base">login</span>
                        Sign In
                    </Link>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                    {LEGAL_DOC_ORDER.map((key) => {
                        const item = LEGAL_DOCS[key];
                        const isActive = key === activeKey;
                        return (
                            <Link
                                key={key}
                                to={`/legal/${key}`}
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors ${
                                    isActive
                                        ? 'border-primary/40 bg-primary/15 text-primary'
                                        : 'border-border-dark bg-panel-dark text-text-muted hover:text-white'
                                }`}
                            >
                                {item.title}
                            </Link>
                        );
                    })}
                </div>

                <article className="rounded-2xl border border-border-dark bg-panel-dark/70 p-6">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-300">{doc.content}</pre>
                </article>
            </div>
        </div>
    );
}
