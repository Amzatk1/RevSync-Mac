'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import type { UserRole } from '@/lib/types';

const steps = ['Upload', 'Details', 'Safety', 'Review'];

export default function TuneUploadPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '',
        description: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year_start: '',
        vehicle_year_end: '',
        stage: '1',
        horsepower_gain: '',
        torque_gain: '',
        price: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [safety, setSafety] = useState({ tested: false, warranty: false, reversible: false, responsible: false });

    const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
    const allSafe = safety.tested && safety.warranty && safety.reversible && safety.responsible;
    const allowedRoles: UserRole[] = ['TUNER', 'CREATOR', 'ADMIN'];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/v1/marketplace/tunes/', {
                ...form,
                vehicle_year_start: Number(form.vehicle_year_start),
                vehicle_year_end: Number(form.vehicle_year_end),
                stage: Number(form.stage),
                horsepower_gain: form.horsepower_gain || null,
                torque_gain: form.torque_gain || null,
                file_url: file?.name || 'tune.bin',
                file_size_kb: file ? Math.round(file.size / 1024) : 0,
            });
            router.push('/tuner');
        } catch (err: unknown) {
            const ex = err as { uiMessage?: string };
            setError(ex?.uiMessage || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Upload Tune" subtitle="Publish a new listing to the marketplace" allowedRoles={allowedRoles}>
            <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-2">
                {steps.map((label, index) => (
                    <div key={label} className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => index < step && setStep(index)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                index === step
                                    ? 'bg-primary text-white'
                                    : index < step
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'border border-white/12 bg-white/[0.02] text-text-muted'
                            }`}
                        >
                            {index < step ? <span className="material-symbols-outlined text-[14px]">check</span> : index + 1}
                        </button>
                        <span className={`whitespace-nowrap text-sm font-medium ${index === step ? 'text-white' : 'text-text-muted'}`}>{label}</span>
                        {index < steps.length - 1 && <span className="mx-1 h-px w-7 bg-white/15" />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="surface-card rounded-3xl p-5 sm:p-6">
                {step === 0 && (
                    <div>
                        <h3 className="text-xl font-black text-white">Upload Tune File</h3>
                        <p className="mt-1 text-sm text-text-muted">Supported formats: .bin, .hex, .srec</p>

                        <button
                            type="button"
                            onClick={() => document.getElementById('tune-file')?.click()}
                            className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center hover:border-primary/35"
                        >
                            <span className="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
                            <p className="mt-3 text-sm font-semibold text-white">{file ? file.name : 'Click to select a tune file'}</p>
                            <p className="mt-1 text-xs text-text-muted">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Max 10MB file size'}</p>
                            <input
                                id="tune-file"
                                type="file"
                                className="hidden"
                                accept=".bin,.hex,.srec"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </button>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={!file}
                                className="rounded-xl border border-primary/30 bg-primary/12 px-6 py-2.5 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-white">Tune Details</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {[
                                { key: 'name', label: 'Tune Name', placeholder: 'Stage 2 Power Pack', type: 'text', required: true, full: true },
                                { key: 'vehicle_make', label: 'Make', placeholder: 'Honda', type: 'text', required: true },
                                { key: 'vehicle_model', label: 'Model', placeholder: 'CBR600RR', type: 'text', required: true },
                                { key: 'vehicle_year_start', label: 'Year From', placeholder: '2020', type: 'number', required: true },
                                { key: 'vehicle_year_end', label: 'Year To', placeholder: '2024', type: 'number', required: true },
                                { key: 'stage', label: 'Stage', placeholder: '1', type: 'number', required: true },
                                { key: 'price', label: 'Price ($)', placeholder: '149.99', type: 'text', required: true },
                                { key: 'horsepower_gain', label: 'HP Gain', placeholder: '15', type: 'text' },
                                { key: 'torque_gain', label: 'Torque Gain', placeholder: '10', type: 'text' },
                            ].map((field) => (
                                <div key={field.key} className={field.full ? 'sm:col-span-2' : ''}>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{field.label}</label>
                                    <input
                                        type={field.type}
                                        required={field.required}
                                        value={form[field.key as keyof typeof form]}
                                        onChange={(e) => set(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                                    />
                                </div>
                            ))}
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    placeholder="Describe this tune and expected behavior"
                                    rows={4}
                                    className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(0)}
                                className="rounded-xl border border-white/12 bg-white/[0.03] px-6 py-2.5 text-sm font-bold text-text-muted hover:text-white"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="rounded-xl border border-primary/30 bg-primary/12 px-6 py-2.5 text-sm font-bold text-primary"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-white">Safety Declaration</h3>
                        <p className="text-sm text-text-muted">Confirm all required checks before publishing.</p>

                        <div className="space-y-3">
                            {[
                                { key: 'tested', label: 'Tested on at least one matching vehicle' },
                                { key: 'warranty', label: 'I acknowledge this can impact warranty coverage' },
                                { key: 'reversible', label: 'Tune is reversible with stock backup' },
                                { key: 'responsible', label: 'Performance claims are accurate and evidence-based' },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setSafety((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof safety] }))}
                                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                                        safety[item.key as keyof typeof safety]
                                            ? 'border-emerald-400/35 bg-emerald-500/10 text-white'
                                            : 'border-white/12 bg-white/[0.02] text-text-muted hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {safety[item.key as keyof typeof safety] ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="rounded-xl border border-white/12 bg-white/[0.03] px-6 py-2.5 text-sm font-bold text-text-muted hover:text-white"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                disabled={!allSafe}
                                className="rounded-xl border border-primary/30 bg-primary/12 px-6 py-2.5 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h3 className="text-xl font-black text-white">Review & Publish</h3>
                        <p className="mt-1 text-sm text-text-muted">Final check before submitting.</p>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {[
                                { label: 'Tune Name', value: form.name },
                                { label: 'Vehicle', value: `${form.vehicle_make} ${form.vehicle_model}` },
                                { label: 'Years', value: `${form.vehicle_year_start}–${form.vehicle_year_end}` },
                                { label: 'Stage', value: `Stage ${form.stage}` },
                                { label: 'Price', value: `$${form.price}` },
                                { label: 'File', value: file?.name || 'N/A' },
                            ].map((row) => (
                                <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{row.label}</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{row.value || '—'}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="rounded-xl border border-white/12 bg-white/[0.03] px-6 py-2.5 text-sm font-bold text-text-muted hover:text-white"
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-red-600 px-8 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                    'Publish Tune'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </AppLayout>
    );
}
