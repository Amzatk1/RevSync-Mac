'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { SafetyReport, PaginatedResponse, UserRole } from '@/lib/types';

export default function AdminHealthPage() {
    const [reports, setReports] = useState<SafetyReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<PaginatedResponse<SafetyReport>>('/v1/safety/reports/');
                setReports(res.results);
            } catch {
                // empty fallback
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const allowedRoles: UserRole[] = ['ADMIN'];
    const avgRisk = reports.length ? Math.round(reports.reduce((sum, report) => sum + report.risk_score, 0) / reports.length) : 0;
    const highRisk = reports.filter((report) => report.risk_score >= 70).length;
    const reviewedCount = reports.filter((report) => Boolean(report.status)).length;

    const riskColor = (score: number) =>
        score >= 70
            ? 'text-red-300 bg-red-500/15 border-red-500/25'
            : score >= 40
              ? 'text-amber-300 bg-amber-500/15 border-amber-500/25'
              : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25';

    const stats = [
        {
            label: 'Total Reports',
            value: reports.length,
            icon: 'description',
            style: 'text-sky-300 bg-sky-500/15',
            helper: 'All captured safety reports',
        },
        {
            label: 'High Risk',
            value: highRisk,
            icon: 'warning',
            style: 'text-red-300 bg-red-500/15',
            helper: 'Risk score 70 or above',
        },
        {
            label: 'Avg Risk',
            value: avgRisk,
            icon: 'analytics',
            style: 'text-amber-300 bg-amber-500/15',
            helper: 'Mean risk across all reports',
        },
        {
            label: 'Reviewed',
            value: reviewedCount,
            icon: 'check_circle',
            style: 'text-emerald-300 bg-emerald-500/15',
            helper: 'Reports with explicit status',
        },
    ];

    return (
        <AppLayout title="System Health" subtitle="Operational safety signal monitoring and report triage" allowedRoles={allowedRoles}>
            <section className="app-panel-raised mb-7 rounded-[30px] p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="max-w-2xl">
                        <p className="section-kicker">Safety Monitoring</p>
                        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Review risk concentration and report state without digging through raw tables first.</h2>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            This surface is for triage, not decoration. It shows how many reports are arriving, how many are genuinely high risk, and whether the current
                            queue is staying within acceptable thresholds.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Highest risk</p>
                            <p className="mt-2 text-2xl font-black text-white">{reports[0]?.risk_score ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">System status</p>
                            <p className="mt-2 text-2xl font-black text-emerald-300">Online</p>
                        </div>
                    </div>
                </div>
            </section>

            {loading ? (
                <LoadingSkeleton type="stat" />
            ) : (
                <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <article key={stat.label} className="app-panel rounded-[24px] p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{stat.label}</span>
                                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.style}`}>
                                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                </span>
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                            <p className="mt-1 text-xs text-text-muted">{stat.helper}</p>
                        </article>
                    ))}
                </section>
            )}

            <section className="app-panel overflow-hidden rounded-[30px]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <div>
                        <h2 className="text-xl font-black text-white">Safety Reports</h2>
                        <p className="mt-1 text-xs text-text-muted">Severity-led table for triage and review.</p>
                    </div>
                    <p className="text-xs text-text-muted">{reports.length} entries</p>
                </div>

                {loading ? (
                    <LoadingSkeleton type="table" rows={5} />
                ) : reports.length === 0 ? (
                    <div className="py-16 text-center">
                        <span className="material-symbols-outlined text-4xl text-emerald-300">verified_user</span>
                        <p className="mt-2 text-sm text-text-muted">No safety reports available.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                            <thead>
                                <tr className="border-b border-white/10 text-left">
                                    <th className="px-6 py-3 th-label">ID</th>
                                    <th className="px-6 py-3 th-label">Date</th>
                                    <th className="px-6 py-3 th-label">Risk Score</th>
                                    <th className="px-6 py-3 th-label">Status</th>
                                    <th className="px-6 py-3 th-label">Triage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-sm font-semibold text-text-body">#{report.id}</td>
                                        <td className="px-6 py-4 text-sm text-text-body">{new Date(report.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            report.risk_score >= 70 ? 'bg-red-400' : report.risk_score >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
                                                        }`}
                                                        style={{ width: `${report.risk_score}%` }}
                                                    />
                                                </div>
                                                <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${riskColor(report.risk_score)}`}>{report.risk_score}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-bold text-text-body">
                                                {report.status || 'Reviewed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold">
                                            <span className={report.risk_score >= 70 ? 'text-red-300' : report.risk_score >= 40 ? 'text-amber-300' : 'text-emerald-300'}>
                                                {report.risk_score >= 70 ? 'Escalate' : report.risk_score >= 40 ? 'Review' : 'Monitor'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AppLayout>
    );
}
