export default function LoadingSkeleton({ rows = 3, type = 'card' }: { rows?: number; type?: 'card' | 'table' | 'stat' }) {
    if (type === 'stat') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="surface-card rounded-2xl p-5">
                        <div className="h-3 w-20 skeleton-shimmer rounded mb-3" />
                        <div className="h-8 w-16 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'table') {
        return (
            <div className="surface-card rounded-2xl overflow-hidden">
                <div className="h-12 bg-white/[0.04]" />
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex gap-4 border-t border-white/10 p-5">
                        <div className="h-4 w-24 skeleton-shimmer rounded" />
                        <div className="h-4 w-32 skeleton-shimmer rounded" />
                        <div className="h-4 w-16 skeleton-shimmer rounded" />
                        <div className="h-4 w-20 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="surface-card rounded-2xl p-5">
                    <div className="h-5 w-3/4 skeleton-shimmer rounded mb-3" />
                    <div className="h-3 w-1/2 skeleton-shimmer rounded mb-4" />
                    <div className="flex gap-2 mb-4">
                        <div className="h-6 w-14 skeleton-shimmer rounded-full" />
                        <div className="h-6 w-14 skeleton-shimmer rounded-full" />
                    </div>
                    <div className="h-10 w-full skeleton-shimmer rounded-lg" />
                </div>
            ))}
        </div>
    );
}
