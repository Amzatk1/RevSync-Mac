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
            style: 'text-blue-300 bg-blue-500/15',
        },
        {
            label: 'High Risk',
            value: highRisk,
            icon: 'warning',
            style: 'text-red-300 bg-red-500/15',
        },
        {
            label: 'Avg Risk',
            value: avgRisk,
            icon: 'analytics',
            style: 'text-amber-300 bg-amber-500/15',
        },
        {
            label: 'System',
            value: 'Online',
            icon: 'check_circle',
            style: 'text-emerald-300 bg-emerald-500/15',
        },
    ];

    return (
        <AppLayout title="System Health" subtitle="Safety signal monitoring and operational status" allowedRoles={allowedRoles}>
            {loading ? (
                <LoadingSkeleton type="stat" />
            ) : (
                <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <article key={stat.label} className="surface-card rounded-2xl p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{stat.label}</span>
                                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.style}`}>
                                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                </span>
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                        </article>
                    ))}
                </section>
            )}

            <section className="surface-card overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h2 className="text-xl font-black text-white">Safety Reports</h2>
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
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="border-b border-white/10 text-left">
                                    <th className="px-6 py-3 th-label">ID</th>
                                    <th className="px-6 py-3 th-label">Date</th>
                                    <th className="px-6 py-3 th-label">Risk Score</th>
                                    <th className="px-6 py-3 th-label">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-sm font-semibold text-text-body">#{report.id}</td>
                                        <td className="px-6 py-4 text-sm text-text-body">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            report.risk_score >= 70
                                                                ? 'bg-red-400'
                                                                : report.risk_score >= 40
                                                                ? 'bg-amber-400'
                                                                : 'bg-emerald-400'
                                                        }`}
                                                        style={{ width: `${report.risk_score}%` }}
                                                    />
                                                </div>
                                                <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${riskColor(report.risk_score)}`}>
                                                    {report.risk_score}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-bold text-text-body">
                                                {report.status || 'Reviewed'}
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
