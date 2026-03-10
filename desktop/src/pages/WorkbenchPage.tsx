import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { TuneListing, Vehicle } from '../lib/types';

type WorkspaceTab = 'overview' | 'map' | 'validation' | 'publish';
type WizardStep = 'vehicle' | 'stock' | 'ecu' | 'metadata';
type ProjectState = 'Draft' | 'Validated' | 'Review Required';
type PackageState = 'Unsigned' | 'Ready To Sign' | 'Signed';

interface ProjectRecord {
    id: string;
    name: string;
    vehicleLabel: string;
    ecuProfile: string;
    stageLabel: string;
    status: ProjectState;
    validationScore: number;
    packageState: PackageState;
    lastOpened: string;
    summary: string;
    stockFileName: string;
    releaseChannel: 'Private' | 'Marketplace';
    source: 'marketplace' | 'new';
    linkedPackage?: string;
    tunerLabel?: string;
}

interface WizardState {
    vehicleId: string;
    stockFileName: string;
    ecuProfile: string;
    projectName: string;
    stageLabel: string;
    summary: string;
    backupRequired: boolean;
    compatibilityLock: boolean;
    releaseChannel: 'Private' | 'Marketplace';
}

interface PaletteCommand {
    id: string;
    label: string;
    icon: string;
    hint?: string;
    action: () => void;
}

const WORKSPACE_TABS: Array<{ id: WorkspaceTab; label: string; icon: string }> = [
    { id: 'overview', label: 'Project Overview', icon: 'dashboard' },
    { id: 'map', label: 'Fuel Map', icon: 'grid_view' },
    { id: 'validation', label: 'Validation Report', icon: 'verified' },
    { id: 'publish', label: 'Publish Flow', icon: 'publish' },
];

const ECU_PROFILES = [
    'Bosch ME17',
    'Keihin RH850',
    'Mitsubishi MH8',
    'Denso SH725xx',
];

const RPM_LABELS = ['1200', '1800', '2400', '3000', '3600', '4200', '4800', '5400', '6000', '6600'];
const LOAD_LABELS = ['0', '8', '16', '24', '32', '40', '55', '70', '85', '100'];

const INITIAL_WIZARD: WizardState = {
    vehicleId: '',
    stockFileName: '',
    ecuProfile: ECU_PROFILES[0],
    projectName: '',
    stageLabel: 'Stage 1',
    summary: '',
    backupRequired: true,
    compatibilityLock: true,
    releaseChannel: 'Marketplace',
};

function generateMapMatrix(seed = 0) {
    return Array.from({ length: RPM_LABELS.length }, (_, row) =>
        Array.from({ length: LOAD_LABELS.length }, (_, col) => {
            const base = 0.86 + row * 0.05 + col * 0.032;
            const wave = Math.sin((row + 1) * 0.6 + seed * 0.01) * 0.04 + Math.cos((col + 1) * 0.42) * 0.03;
            return Number((base + wave).toFixed(2));
        })
    );
}

function formatRelativeOpen(index: number) {
    return ['Just now', '14m ago', 'Yesterday', '3d ago'][index] || 'Last week';
}

function mapScoreToStatus(score: number): ProjectState {
    if (score >= 94) return 'Validated';
    if (score >= 87) return 'Review Required';
    return 'Draft';
}

function mapScoreToPackage(score: number): PackageState {
    if (score >= 95) return 'Signed';
    if (score >= 89) return 'Ready To Sign';
    return 'Unsigned';
}

function classNames(...values: Array<string | false | null | undefined>) {
    return values.filter(Boolean).join(' ');
}

export default function WorkbenchPage() {
    const navigate = useNavigate();
    const [listings, setListings] = useState<TuneListing[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
    const [mapData, setMapData] = useState(generateMapMatrix());
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<WizardStep>('vehicle');
    const [wizardState, setWizardState] = useState<WizardState>(INITIAL_WIZARD);
    const [releaseNotes, setReleaseNotes] = useState(
        'Validated against package policy. Backup-first execution required. Release for staged workshop rollout.'
    );
    const [terminalOpen, setTerminalOpen] = useState(true);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [paletteQuery, setPaletteQuery] = useState('');
    const [terminalLines, setTerminalLines] = useState<string[]>([
        'RevSync Pro workbench ready.',
        'Command surface online. Press Cmd/Ctrl+K to open.',
        'Safety policies loaded: signature, compatibility, recovery-first.',
    ]);

    useEffect(() => {
        api.get<any>('/v1/marketplace/browse/')
            .then((res) => setListings(Array.isArray(res) ? res : res?.results || []))
            .catch(() => setListings([]));

        api.get<any>('/v1/garage/')
            .then((res) => setVehicles(Array.isArray(res) ? res : res?.results || []))
            .catch(() => setVehicles([]));
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setPaletteOpen((value) => !value);
                setPaletteQuery('');
            }

            if (event.key === 'Escape') {
                setPaletteOpen(false);
                setWizardOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        if (!wizardState.vehicleId && vehicles[0]) {
            setWizardState((current) => ({
                ...current,
                vehicleId: String(vehicles[0].id),
                projectName: current.projectName || `${vehicles[0].make} ${vehicles[0].model} Base Calibration`,
                summary: current.summary || `Controlled calibration workspace for ${vehicles[0].make} ${vehicles[0].model}.`,
            }));
        }
    }, [vehicles, wizardState.vehicleId]);

    const recentProjects = useMemo<ProjectRecord[]>(() => {
        return listings.slice(0, 4).map((listing, index) => ({
            id: String(listing.id),
            name: listing.title,
            vehicleLabel: `${listing.vehicle_make} ${listing.vehicle_model}`,
            ecuProfile: ['Bosch ME17', 'Keihin RH850', 'Mitsubishi MH8', 'Denso SH725xx'][index % 4],
            stageLabel: `Stage ${index + 1}`,
            status: mapScoreToStatus(96 - index * 3),
            validationScore: 96 - index * 3,
            packageState: mapScoreToPackage(96 - index * 3),
            lastOpened: formatRelativeOpen(index),
            summary: listing.description,
            stockFileName: `${listing.slug || 'base-calibration'}.bin`,
            releaseChannel: index % 2 === 0 ? 'Marketplace' : 'Private',
            source: 'marketplace',
            linkedPackage: listing.latest_version_number || 'v1.0.0',
            tunerLabel: listing.tuner?.business_name || 'Verified tuner',
        }));
    }, [listings]);

    const selectedVehicle = useMemo(
        () => vehicles.find((vehicle) => String(vehicle.id) === wizardState.vehicleId) || vehicles[0] || null,
        [vehicles, wizardState.vehicleId]
    );

    const validationReport = useMemo(() => {
        const score = activeProject?.validationScore ?? 93;
        const blockers =
            score < 90
                ? ['Package signature must be regenerated before release.', 'Compatibility table is missing ECU firmware lock.']
                : ['None. All blocking validations cleared.'];
        const warnings = [
            'Battery guidance must remain visible in mobile flashing flow.',
            'Release notes should mention baseline checksum strategy.',
            'Recovery snapshot should be staged with the package artifact.',
        ];

        return {
            score,
            readiness: activeProject?.packageState || 'Ready To Sign',
            blockers,
            warnings,
            checks: [
                { label: 'Signature chain', value: score >= 90 ? 'Ready' : 'Blocked', tone: score >= 90 ? 'success' : 'danger' },
                { label: 'Compatibility lock', value: score >= 93 ? 'Strict' : 'Pending', tone: score >= 93 ? 'success' : 'warning' },
                { label: 'Recovery policy', value: 'Backup required', tone: 'info' },
                { label: 'Marketplace readiness', value: score >= 95 ? 'Approved' : 'Review required', tone: score >= 95 ? 'success' : 'warning' },
            ],
        };
    }, [activeProject]);

    const addTerminalLine = useCallback((message: string) => {
        setTerminalLines((current) => [...current.slice(-16), message]);
    }, []);

    const openProject = useCallback(
        (project: ProjectRecord) => {
            setActiveProject(project);
            setActiveTab('overview');
            setMapData(generateMapMatrix(project.validationScore));
            setSelectedCell(null);
            addTerminalLine(`Opened project: ${project.name}`);
            addTerminalLine(`Workspace policy applied: ${project.releaseChannel} release channel.`);
        },
        [addTerminalLine]
    );

    const resetWizard = useCallback(() => {
        setWizardStep('vehicle');
        setWizardState({
            ...INITIAL_WIZARD,
            vehicleId: vehicles[0] ? String(vehicles[0].id) : '',
            projectName: vehicles[0] ? `${vehicles[0].make} ${vehicles[0].model} Base Calibration` : '',
            summary: vehicles[0] ? `Controlled calibration workspace for ${vehicles[0].make} ${vehicles[0].model}.` : '',
        });
    }, [vehicles]);

    const openWizard = useCallback(() => {
        resetWizard();
        setWizardOpen(true);
    }, [resetWizard]);

    const completeWizard = useCallback(() => {
        const vehicle = vehicles.find((item) => String(item.id) === wizardState.vehicleId);
        const project: ProjectRecord = {
            id: `project-${Date.now()}`,
            name: wizardState.projectName || `${vehicle?.make || 'Vehicle'} Calibration`,
            vehicleLabel: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unassigned vehicle',
            ecuProfile: wizardState.ecuProfile,
            stageLabel: wizardState.stageLabel,
            status: 'Draft',
            validationScore: 91,
            packageState: 'Ready To Sign',
            lastOpened: 'Just now',
            summary: wizardState.summary || 'New deterministic tune workspace.',
            stockFileName: wizardState.stockFileName || 'stock-base.bin',
            releaseChannel: wizardState.releaseChannel,
            source: 'new',
        };

        setWizardOpen(false);
        openProject(project);
        addTerminalLine(`Project created: ${project.name}`);
        addTerminalLine(`ECU profile locked to ${project.ecuProfile}.`);
    }, [wizardState, vehicles, openProject, addTerminalLine]);

    const commandItems = useMemo<PaletteCommand[]>(
        () => [
            { id: 'new-project', label: 'New tune project', icon: 'note_stack_add', hint: 'Wizard', action: openWizard },
            { id: 'open-start', label: 'Return to Start Center', icon: 'home', action: () => setActiveProject(null) },
            { id: 'open-validation', label: 'Open validation report', icon: 'verified', action: () => setActiveTab('validation') },
            { id: 'open-publish', label: 'Open publish flow', icon: 'publish', action: () => setActiveTab('publish') },
            { id: 'open-recovery', label: 'Open recovery tools', icon: 'healing', action: () => navigate('/recovery') },
            { id: 'open-diagnostics', label: 'Open diagnostics', icon: 'monitoring', action: () => navigate('/diagnostics') },
            ...recentProjects.map((project) => ({
                id: `project-${project.id}`,
                label: `Open ${project.name}`,
                icon: 'folder_open',
                hint: project.lastOpened,
                action: () => openProject(project),
            })),
        ],
        [navigate, openProject, openWizard, recentProjects]
    );

    const filteredCommands = useMemo(() => {
        const query = paletteQuery.trim().toLowerCase();
        return query
            ? commandItems.filter((item) => item.label.toLowerCase().includes(query))
            : commandItems;
    }, [commandItems, paletteQuery]);

    const highlightedCell = selectedCell
        ? mapData[selectedCell[0]]?.[selectedCell[1]]
        : null;

    const updateMapCell = useCallback((delta: number) => {
        if (!selectedCell) return;
        setMapData((current) =>
            current.map((row, rowIndex) =>
                row.map((value, colIndex) =>
                    rowIndex === selectedCell[0] && colIndex === selectedCell[1]
                        ? Number((value + delta).toFixed(2))
                        : value
                )
            )
        );
        addTerminalLine(`Adjusted map cell R${selectedCell[0] + 1} C${selectedCell[1] + 1} by ${delta > 0 ? '+' : ''}${delta.toFixed(2)}.`);
    }, [selectedCell, addTerminalLine]);

    const renderStartCenter = () => (
        <div className="flex-1 overflow-y-auto px-7 py-7">
            <section className="rs-panel-elevated relative overflow-hidden rounded-[28px] p-7">
                <div className="rs-gridline absolute inset-0 opacity-[0.08]" />
                <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-[rgba(99,199,255,0.12)] blur-3xl" />
                <div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-[rgba(234,16,60,0.08)] blur-3xl" />

                <div className="relative z-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                        <p className="rs-section-label text-[var(--rs-accent)]">Start Center</p>
                        <h2 className="mt-3 max-w-3xl text-[2.6rem] font-[800] leading-[1.02] text-white">
                            Build, validate, and release ECU projects from one deterministic workbench.
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--rs-text-secondary)]">
                            RevSync Pro now starts in a controlled command center: create tune projects, reopen recent work,
                            inspect validation readiness, and move directly into recovery or diagnostics without context loss.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <button className="rs-toolbar-button rs-button-primary" onClick={openWizard}>
                                <span className="material-symbols-outlined text-[18px]">note_stack_add</span>
                                New tune project
                            </button>
                            <button
                                className="rs-toolbar-button rs-button-secondary"
                                onClick={() => recentProjects[0] && openProject(recentProjects[0])}
                            >
                                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                                Open recent workspace
                            </button>
                            <button className="rs-toolbar-button" onClick={() => navigate('/recovery')}>
                                <span className="material-symbols-outlined text-[18px]">healing</span>
                                Recovery utilities
                            </button>
                        </div>

                        <div className="mt-7 flex flex-wrap gap-2.5">
                            {[
                                'Backup-first execution',
                                'Compatibility locking',
                                'Signed package policy',
                                'Deterministic publish review',
                            ].map((item) => (
                                <span
                                    key={item}
                                    className="inline-flex items-center gap-2 rounded-full border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-[var(--rs-text-secondary)]"
                                >
                                    <span className="material-symbols-outlined text-[14px] text-[var(--rs-accent)]">verified</span>
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {[
                            { label: 'Operator confidence', value: '94%', helper: 'Validation heuristics satisfied' },
                            { label: 'Signing readiness', value: 'Ready', helper: 'Packages can be sealed after review' },
                            { label: 'Connected workflows', value: '3', helper: 'Workbench, diagnostics, recovery' },
                        ].map((item) => (
                            <div key={item.label} className="rs-panel rounded-[20px] p-4">
                                <p className="rs-section-label">{item.label}</p>
                                <p className="mt-2 text-3xl font-[800] text-white">{item.value}</p>
                                <p className="mt-1 text-sm text-[var(--rs-text-secondary)]">{item.helper}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
                <div className="rs-panel rounded-[24px] p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="rs-section-label">Recent Projects</p>
                            <h3 className="mt-1 text-xl font-[750] text-white">Resume where controlled work left off.</h3>
                        </div>
                        <button className="rs-toolbar-button" onClick={() => setActiveProject(null)}>
                            <span className="material-symbols-outlined text-[18px]">view_timeline</span>
                            Focus mode
                        </button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                        {recentProjects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => openProject(project)}
                                className="rs-panel-raised rounded-[20px] p-4 text-left hover:translate-y-[-1px]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-[700] text-white">{project.name}</p>
                                        <p className="mt-1 text-sm text-[var(--rs-text-secondary)]">{project.vehicleLabel}</p>
                                    </div>
                                    <span className="rs-badge border-[rgba(99,199,255,0.18)] bg-[rgba(99,199,255,0.08)] text-[var(--rs-accent)]">
                                        {project.status}
                                    </span>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    <MetricTile label="Score" value={String(project.validationScore)} />
                                    <MetricTile label="Package" value={project.packageState} />
                                    <MetricTile label="Opened" value={project.lastOpened} />
                                </div>
                                <p className="mt-4 text-sm leading-6 text-[var(--rs-text-secondary)]">{project.summary}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="rs-panel rounded-[24px] p-5">
                        <p className="rs-section-label">Release Utilities</p>
                        <h3 className="mt-1 text-xl font-[750] text-white">Fail-closed actions stay close to the operator.</h3>
                        <div className="mt-4 grid gap-3">
                            {[
                                {
                                    title: 'Import stock file',
                                    body: 'Stage raw OEM data into a new calibration project with checksum and fingerprint checks.',
                                    icon: 'upload_file',
                                    action: openWizard,
                                },
                                {
                                    title: 'Open diagnostics',
                                    body: 'Inspect transport health, PID telemetry, and deterministic recovery status.',
                                    icon: 'monitoring',
                                    action: () => navigate('/diagnostics'),
                                },
                                {
                                    title: 'Recovery station',
                                    body: 'Access recovery-only tools with explicit danger gates and backup-first messaging.',
                                    icon: 'healing',
                                    action: () => navigate('/recovery'),
                                },
                            ].map((item) => (
                                <button
                                    key={item.title}
                                    onClick={item.action}
                                    className="rs-surface-muted rounded-[18px] p-4 text-left hover:border-[var(--rs-stroke-strong)]"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[rgba(99,199,255,0.09)] text-[var(--rs-accent)]">
                                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-[700] text-white">{item.title}</p>
                                            <p className="mt-1 text-sm leading-6 text-[var(--rs-text-secondary)]">{item.body}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rs-panel rounded-[24px] p-5">
                        <p className="rs-section-label">Marketplace Queue</p>
                        <div className="mt-4 space-y-3">
                            {listings.slice(0, 3).map((listing) => (
                                <div key={listing.id} className="flex items-center justify-between rounded-[18px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3">
                                    <div>
                                        <p className="text-sm font-[700] text-white">{listing.title}</p>
                                        <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">
                                            {listing.vehicle_make} {listing.vehicle_model} • {listing.latest_version_number || 'Awaiting package'}
                                        </p>
                                    </div>
                                    <span className="rs-badge border-[rgba(46,211,154,0.16)] bg-[rgba(46,211,154,0.08)] text-[var(--rs-success)]">
                                        Browse
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderOverview = () => (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="grid gap-5">
                <div className="rs-panel-elevated rounded-[24px] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="rs-section-label">Active Project</p>
                            <h2 className="mt-1 text-2xl font-[780] text-white">{activeProject?.name}</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rs-text-secondary)]">{activeProject?.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="rs-badge border-[rgba(99,199,255,0.18)] bg-[rgba(99,199,255,0.08)] text-[var(--rs-accent)]">
                                {activeProject?.status}
                            </span>
                            <span className="rs-badge border-[rgba(46,211,154,0.16)] bg-[rgba(46,211,154,0.08)] text-[var(--rs-success)]">
                                {activeProject?.packageState}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricTile label="Vehicle" value={activeProject?.vehicleLabel || 'Unassigned'} />
                        <MetricTile label="ECU Profile" value={activeProject?.ecuProfile || 'Unknown'} />
                        <MetricTile label="Release" value={activeProject?.releaseChannel || 'Private'} />
                        <MetricTile label="Validation" value={`${activeProject?.validationScore || 0}/100`} />
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rs-panel rounded-[24px] p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="rs-section-label">Readiness Gates</p>
                                <h3 className="mt-1 text-lg font-[740] text-white">Deterministic release prerequisites</h3>
                            </div>
                            <span className="rs-badge border-[rgba(255,184,92,0.18)] bg-[rgba(255,184,92,0.08)] text-[var(--rs-warning)]">
                                Locked
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {[
                                'Vehicle profile selected and locked',
                                'Stock file imported with checksum trace',
                                'ECU family verified against compatibility policy',
                                'Backup-first release channel enforced',
                            ].map((item, index) => (
                                <div key={item} className="flex items-center gap-3 rounded-[16px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(46,211,154,0.1)] text-[var(--rs-success)]">
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-[650] text-white">{item}</p>
                                        <p className="mt-0.5 text-xs text-[var(--rs-text-secondary)]">Gate {index + 1} satisfied before flashing or publish.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rs-panel rounded-[24px] p-5">
                        <p className="rs-section-label">Compatibility Matrix</p>
                        <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--rs-stroke-soft)]">
                            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] bg-white/[0.04] px-4 py-3 text-xs font-[700] uppercase tracking-[0.14em] text-[var(--rs-text-tertiary)]">
                                <span>Signal</span>
                                <span>State</span>
                                <span>Policy</span>
                            </div>
                            {[
                                ['ECU firmware lock', 'Matched', 'Strict'],
                                ['Recovery snapshot', 'Available', 'Required'],
                                ['Payload signing', 'Ready', 'Enforced'],
                                ['Flash entitlement', 'Controlled', 'Role-gated'],
                            ].map(([signal, state, policy]) => (
                                <div
                                    key={signal}
                                    className="grid grid-cols-[1.2fr_0.8fr_0.8fr] border-t border-[var(--rs-stroke-soft)] px-4 py-3 text-sm text-[var(--rs-text-secondary)]"
                                >
                                    <span>{signal}</span>
                                    <span className="text-white">{state}</span>
                                    <span>{policy}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-5">
                <div className="rs-panel rounded-[24px] p-5">
                    <p className="rs-section-label">Timeline</p>
                    <div className="mt-4 space-y-4">
                        {[
                            { title: 'Project created', body: 'Vehicle and ECU profile locked into deterministic workspace.' },
                            { title: 'Validation staged', body: 'Checksum, signature, and recovery policy passed into ready queue.' },
                            { title: 'Publish notes drafted', body: 'Release copy prepared for private or marketplace review.' },
                        ].map((event) => (
                            <div key={event.title} className="flex gap-3">
                                <div className="mt-1 h-8 w-8 rounded-full bg-[rgba(99,199,255,0.1)] text-[var(--rs-accent)] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                                </div>
                                <div>
                                    <p className="text-sm font-[700] text-white">{event.title}</p>
                                    <p className="mt-1 text-sm leading-6 text-[var(--rs-text-secondary)]">{event.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );

    const renderMapEditor = () => (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rs-panel rounded-[24px] p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="rs-section-label">Fuel Map Editor</p>
                        <h3 className="mt-1 text-lg font-[740] text-white">Technical data remains dense, but visually calm.</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="rs-toolbar-button" onClick={() => updateMapCell(-0.02)} disabled={!selectedCell}>
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <button className="rs-toolbar-button" onClick={() => updateMapCell(0.02)} disabled={!selectedCell}>
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-auto rounded-[18px] border border-[var(--rs-stroke-soft)]">
                    <div className="grid grid-cols-[88px_repeat(10,minmax(72px,1fr))] bg-white/[0.04] px-4 py-3 text-[11px] font-[700] uppercase tracking-[0.14em] text-[var(--rs-text-tertiary)]">
                        <span>RPM / Load</span>
                        {LOAD_LABELS.map((label) => (
                            <span key={label} className="text-center">
                                {label}%
                            </span>
                        ))}
                    </div>

                    {mapData.map((row, rowIndex) => (
                        <div
                            key={RPM_LABELS[rowIndex]}
                            className="grid grid-cols-[88px_repeat(10,minmax(72px,1fr))] border-t border-[var(--rs-stroke-soft)] px-4 py-2.5"
                        >
                            <span className="flex items-center text-xs font-[700] text-[var(--rs-text-secondary)]">{RPM_LABELS[rowIndex]}</span>
                            {row.map((value, colIndex) => {
                                const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex;
                                return (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        onClick={() => setSelectedCell([rowIndex, colIndex])}
                                        className={classNames(
                                            'mx-1 rounded-[14px] border px-2 py-2 text-center font-mono text-sm',
                                            isSelected
                                                ? 'border-[rgba(99,199,255,0.38)] bg-[rgba(99,199,255,0.12)] text-white shadow-[inset_0_0_0_1px_rgba(99,199,255,0.18)]'
                                                : 'border-transparent bg-white/[0.03] text-[var(--rs-text-secondary)] hover:border-[var(--rs-stroke-soft)] hover:text-white'
                                        )}
                                    >
                                        {value.toFixed(2)}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-5">
                <div className="rs-panel rounded-[24px] p-5">
                    <p className="rs-section-label">Selected Cell</p>
                    {selectedCell ? (
                        <div className="mt-4 space-y-3">
                            <MetricTile label="RPM band" value={RPM_LABELS[selectedCell[0]]} />
                            <MetricTile label="Load" value={`${LOAD_LABELS[selectedCell[1]]}%`} />
                            <MetricTile label="Target value" value={highlightedCell?.toFixed(2) || '--'} />
                        </div>
                    ) : (
                        <p className="mt-4 text-sm leading-6 text-[var(--rs-text-secondary)]">
                            Select a map cell to inspect and apply deterministic adjustments from the right-hand controls.
                        </p>
                    )}
                </div>

                <div className="rs-panel rounded-[24px] p-5">
                    <p className="rs-section-label">Editing Policy</p>
                    <div className="mt-4 space-y-3">
                        {[
                            'No hidden interpolation or destructive bulk actions in the first pass.',
                            'Changes stay visible in terminal output and validation history.',
                            'Map edits remain fast, but never playful or noisy.',
                        ].map((item) => (
                            <div key={item} className="rounded-[16px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--rs-text-secondary)]">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );

    const renderValidation = () => (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="rs-panel-elevated rounded-[24px] p-5">
                <p className="rs-section-label">Validation Summary</p>
                <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-[3.4rem] font-[800] leading-none text-white">{validationReport.score}</p>
                        <p className="mt-2 text-sm text-[var(--rs-text-secondary)]">Overall safety and release confidence score</p>
                    </div>
                    <span className="rs-badge border-[rgba(46,211,154,0.18)] bg-[rgba(46,211,154,0.09)] text-[var(--rs-success)]">
                        {validationReport.readiness}
                    </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {validationReport.checks.map((check) => (
                        <div key={check.label} className="rounded-[18px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] p-4">
                            <p className="rs-section-label">{check.label}</p>
                            <p
                                className={classNames(
                                    'mt-2 text-lg font-[740]',
                                    check.tone === 'success' && 'text-[var(--rs-success)]',
                                    check.tone === 'warning' && 'text-[var(--rs-warning)]',
                                    check.tone === 'danger' && 'text-[var(--rs-danger)]',
                                    check.tone === 'info' && 'text-[var(--rs-accent)]'
                                )}
                            >
                                {check.value}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-5">
                <div className="rs-panel rounded-[24px] p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="rs-section-label">Blocking Issues</p>
                            <h3 className="mt-1 text-lg font-[740] text-white">Severity-led first, details second.</h3>
                        </div>
                        <span className="rs-badge border-[rgba(255,184,92,0.18)] bg-[rgba(255,184,92,0.08)] text-[var(--rs-warning)]">
                            Review
                        </span>
                    </div>
                    <div className="mt-4 space-y-3">
                        {validationReport.blockers.map((item) => (
                            <div key={item} className="rounded-[18px] border border-[rgba(255,184,92,0.18)] bg-[rgba(255,184,92,0.06)] px-4 py-4">
                                <p className="text-sm font-[700] text-white">{item}</p>
                                <p className="mt-1 text-sm text-[var(--rs-text-secondary)]">
                                    All blocking states must clear before flashing or package signing can continue.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rs-panel rounded-[24px] p-5">
                    <p className="rs-section-label">Warnings</p>
                    <div className="mt-4 space-y-3">
                        {validationReport.warnings.map((warning) => (
                            <div key={warning} className="rounded-[18px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--rs-text-secondary)]">
                                {warning}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );

    const renderPublish = () => (
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rs-panel rounded-[24px] p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="rs-section-label">Package Summary</p>
                        <h3 className="mt-1 text-lg font-[740] text-white">Controlled publish flow</h3>
                    </div>
                    <span className="rs-badge border-[rgba(99,199,255,0.18)] bg-[rgba(99,199,255,0.08)] text-[var(--rs-accent)]">
                        {activeProject?.releaseChannel}
                    </span>
                </div>

                <div className="mt-4 grid gap-3">
                    {[
                        ['Project', activeProject?.name || '--'],
                        ['Stock source', activeProject?.stockFileName || '--'],
                        ['Validation state', activeProject?.status || '--'],
                        ['Signature state', activeProject?.packageState || '--'],
                    ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between rounded-[16px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3">
                            <span className="text-sm text-[var(--rs-text-secondary)]">{label}</span>
                            <span className="text-sm font-[700] text-white">{value}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rs-panel-elevated rounded-[24px] p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="rs-section-label">Release Notes</p>
                        <h3 className="mt-1 text-lg font-[740] text-white">Explain what changed and why it is safe.</h3>
                    </div>
                    <button
                        className="rs-toolbar-button rs-button-primary"
                        onClick={() => addTerminalLine(`Publish requested for ${activeProject?.name || 'project'}. Awaiting final operator confirmation.`)}
                    >
                        <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                        Publish package
                    </button>
                </div>

                <textarea
                    value={releaseNotes}
                    onChange={(event) => setReleaseNotes(event.target.value)}
                    className="rs-input mt-4 min-h-[170px] resize-none px-4 py-3 text-sm leading-6"
                />

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                        'Release copy reflects validation score and recovery requirements.',
                        'Signature state is visible before publish confirmation.',
                        'Marketplace packages remain gated by compatibility policy.',
                        'No celebratory motion or risky ambiguity around final action.',
                    ].map((item) => (
                        <div key={item} className="rounded-[16px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--rs-text-secondary)]">
                            {item}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );

    const renderWorkspace = () => (
        <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="rs-panel border-r border-[var(--rs-stroke-soft)] flex w-[300px] shrink-0 flex-col overflow-hidden rounded-none border-y-0 border-l-0">
                <div className="border-b border-[var(--rs-stroke-soft)] px-5 py-4">
                    <p className="rs-section-label">Project Tree</p>
                    <h3 className="mt-1 text-lg font-[740] text-white">{activeProject?.name}</h3>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="mb-5 space-y-1">
                        {WORKSPACE_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={classNames(
                                    'flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left',
                                    activeTab === tab.id
                                        ? 'border border-[rgba(99,199,255,0.2)] bg-[rgba(99,199,255,0.1)] text-white'
                                        : 'border border-transparent text-[var(--rs-text-secondary)] hover:bg-white/[0.03] hover:text-white'
                                )}
                            >
                                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                <span className="text-sm font-[650]">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="rounded-[20px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] p-4">
                        <p className="rs-section-label">Artifacts</p>
                        <div className="mt-3 space-y-2">
                            {[
                                activeProject?.stockFileName || 'stock-base.bin',
                                'fuel-map.table',
                                'validation-report.json',
                                'release-package.revsyncpkg',
                            ].map((item, index) => (
                                <div key={item} className="flex items-center gap-3 rounded-[14px] px-3 py-2 text-sm text-[var(--rs-text-secondary)]">
                                    <span className="material-symbols-outlined text-[18px] text-[var(--rs-accent)]">
                                        {index === 0 ? 'description' : index === 1 ? 'grid_view' : index === 2 ? 'verified' : 'archive'}
                                    </span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div className="border-b border-[var(--rs-stroke-soft)] bg-[rgba(10,14,20,0.78)] px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {WORKSPACE_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    className="rs-tab"
                                    data-active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button className="rs-toolbar-button" onClick={() => setPaletteOpen(true)}>
                            <span className="material-symbols-outlined text-[18px]">search</span>
                            Command surface
                            <span className="rs-kbd">⌘K</span>
                        </button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'map' && renderMapEditor()}
                            {activeTab === 'validation' && renderValidation()}
                            {activeTab === 'publish' && renderPublish()}
                        </div>

                        {terminalOpen && (
                            <div className="rs-terminal h-[198px] shrink-0 px-5 py-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="rs-section-label">Output / Log Panel</p>
                                        <p className="mt-1 text-sm text-[var(--rs-text-secondary)]">
                                            Terminal remains present, but visually quieter than the editor canvas.
                                        </p>
                                    </div>
                                    <button className="rs-toolbar-button" onClick={() => setTerminalOpen(false)}>
                                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                                        Collapse
                                    </button>
                                </div>
                                <div className="h-[116px] overflow-y-auto rounded-[18px] border border-[var(--rs-stroke-soft)] bg-black/30 px-4 py-3 font-mono text-[12px] leading-6 text-[var(--rs-text-secondary)]">
                                    {terminalLines.map((line) => (
                                        <div key={line}>{line}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!terminalOpen && (
                            <div className="border-t border-[var(--rs-stroke-soft)] px-5 py-3">
                                <button className="rs-toolbar-button" onClick={() => setTerminalOpen(true)}>
                                    <span className="material-symbols-outlined text-[18px]">terminal</span>
                                    Show output panel
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="rs-panel w-[318px] shrink-0 overflow-y-auto rounded-none border-y-0 border-r-0 px-5 py-5">
                        <p className="rs-section-label">Inspector</p>
                        <div className="mt-4 space-y-4">
                            <InspectorGroup
                                title="Project metadata"
                                rows={[
                                    ['Vehicle', activeProject?.vehicleLabel || '--'],
                                    ['ECU family', activeProject?.ecuProfile || '--'],
                                    ['Stage', activeProject?.stageLabel || '--'],
                                    ['Channel', activeProject?.releaseChannel || '--'],
                                ]}
                            />
                            <InspectorGroup
                                title="Safety policy"
                                rows={[
                                    ['Compatibility lock', 'Strict'],
                                    ['Backup-first', 'Required'],
                                    ['Signature chain', activeProject?.packageState || '--'],
                                    ['Review state', activeProject?.status || '--'],
                                ]}
                            />
                            <div className="rounded-[20px] border border-[rgba(234,16,60,0.18)] bg-[rgba(234,16,60,0.07)] p-4">
                                <p className="rs-section-label text-[var(--rs-danger)]">Safety Gate</p>
                                <p className="mt-2 text-sm font-[700] text-white">No flashing actions are exposed here.</p>
                                <p className="mt-1 text-sm leading-6 text-[var(--rs-text-secondary)]">
                                    Workbench focuses on building and validating the package. Execution stays explicitly separated.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );

    return (
        <>
            <div className="flex min-h-0 flex-1 overflow-hidden">
                {activeProject ? renderWorkspace() : renderStartCenter()}
            </div>

            {paletteOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(4,7,11,0.66)] px-5 pt-24 backdrop-blur-[10px]">
                    <div className="rs-panel-elevated w-full max-w-[720px] rounded-[28px] p-4 shadow-[var(--rs-shadow-modal)]">
                        <div className="flex items-center gap-3 rounded-[18px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3">
                            <span className="material-symbols-outlined text-[20px] text-[var(--rs-accent)]">search</span>
                            <input
                                value={paletteQuery}
                                onChange={(event) => setPaletteQuery(event.target.value)}
                                placeholder="Search commands, recent projects, or workbench flows"
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--rs-text-tertiary)]"
                                autoFocus
                            />
                            <span className="rs-kbd">Esc</span>
                        </div>
                        <div className="mt-3 max-h-[420px] overflow-y-auto rounded-[20px] border border-[var(--rs-stroke-soft)]">
                            {filteredCommands.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        item.action();
                                        setPaletteOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 border-b border-[var(--rs-stroke-soft)] px-4 py-3 text-left last:border-b-0 hover:bg-white/[0.04]"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(99,199,255,0.08)] text-[var(--rs-accent)]">
                                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-[700] text-white">{item.label}</p>
                                        {item.hint && <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">{item.hint}</p>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {wizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,7,11,0.72)] px-5 backdrop-blur-[12px]">
                    <div className="rs-panel-elevated w-full max-w-[960px] rounded-[30px] p-6 shadow-[var(--rs-shadow-modal)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="rs-section-label text-[var(--rs-accent)]">New Tune Project Wizard</p>
                                <h2 className="mt-2 text-[2rem] font-[800] text-white">Deterministic setup, fail-closed by default.</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rs-text-secondary)]">
                                    The first-pass wizard intentionally stays explicit: vehicle, stock file, ECU profile, and release safeguards
                                    are captured before a project can enter the workspace.
                                </p>
                            </div>
                            <button className="rs-toolbar-button" onClick={() => setWizardOpen(false)}>
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
                            <div className="space-y-2">
                                {[
                                    ['vehicle', 'Vehicle selection'],
                                    ['stock', 'Stock file import'],
                                    ['ecu', 'ECU identification'],
                                    ['metadata', 'Metadata & safeguards'],
                                ].map(([stepId, label]) => (
                                    <button
                                        key={stepId}
                                        className={classNames(
                                            'flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left',
                                            wizardStep === stepId
                                                ? 'border-[rgba(99,199,255,0.22)] bg-[rgba(99,199,255,0.1)] text-white'
                                                : 'border-[var(--rs-stroke-soft)] bg-white/[0.03] text-[var(--rs-text-secondary)]'
                                        )}
                                        onClick={() => setWizardStep(stepId as WizardStep)}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {stepId === 'vehicle'
                                                ? 'directions_car'
                                                : stepId === 'stock'
                                                ? 'upload_file'
                                                : stepId === 'ecu'
                                                ? 'memory'
                                                : 'policy'}
                                        </span>
                                        <span className="text-sm font-[650]">{label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="rs-panel rounded-[24px] p-5">
                                {wizardStep === 'vehicle' && (
                                    <div>
                                        <p className="rs-section-label">Vehicle Selection</p>
                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            {vehicles.map((vehicle) => {
                                                const active = wizardState.vehicleId === String(vehicle.id);
                                                return (
                                                    <button
                                                        key={vehicle.id}
                                                        onClick={() =>
                                                            setWizardState((current) => ({
                                                                ...current,
                                                                vehicleId: String(vehicle.id),
                                                                projectName: `${vehicle.make} ${vehicle.model} Base Calibration`,
                                                                summary: `Controlled calibration workspace for ${vehicle.make} ${vehicle.model}.`,
                                                            }))
                                                        }
                                                        className={classNames(
                                                            'rounded-[18px] border p-4 text-left',
                                                            active
                                                                ? 'border-[rgba(99,199,255,0.22)] bg-[rgba(99,199,255,0.1)]'
                                                                : 'border-[var(--rs-stroke-soft)] bg-white/[0.03] hover:border-[var(--rs-stroke-strong)]'
                                                        )}
                                                    >
                                                        <p className="text-sm font-[700] text-white">
                                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                                        </p>
                                                        <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">{vehicle.ecu_type || 'ECU family pending'}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 'stock' && (
                                    <div>
                                        <p className="rs-section-label">Stock File Import</p>
                                        <div className="mt-4 space-y-4">
                                            <div className="rounded-[20px] border border-dashed border-[var(--rs-stroke-strong)] bg-white/[0.02] px-5 py-7 text-center">
                                                <span className="material-symbols-outlined text-[24px] text-[var(--rs-accent)]">upload_file</span>
                                                <p className="mt-3 text-sm font-[700] text-white">Import OEM baseline or drag a local binary.</p>
                                                <p className="mt-1 text-sm text-[var(--rs-text-secondary)]">
                                                    This first implementation stores the chosen filename and marks checksum review as required.
                                                </p>
                                            </div>
                                            <input
                                                className="rs-input"
                                                value={wizardState.stockFileName}
                                                onChange={(event) =>
                                                    setWizardState((current) => ({ ...current, stockFileName: event.target.value }))
                                                }
                                                placeholder="e.g. zx6r-2024-stock-base.bin"
                                            />
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 'ecu' && (
                                    <div>
                                        <p className="rs-section-label">ECU Identification</p>
                                        <div className="mt-4 flex flex-wrap gap-2.5">
                                            {ECU_PROFILES.map((profile) => (
                                                <button
                                                    key={profile}
                                                    onClick={() => setWizardState((current) => ({ ...current, ecuProfile: profile }))}
                                                    className={classNames(
                                                        'rounded-full border px-3.5 py-2 text-sm font-[650]',
                                                        wizardState.ecuProfile === profile
                                                            ? 'border-[rgba(99,199,255,0.22)] bg-[rgba(99,199,255,0.1)] text-white'
                                                            : 'border-[var(--rs-stroke-soft)] bg-white/[0.03] text-[var(--rs-text-secondary)]'
                                                    )}
                                                >
                                                    {profile}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 'metadata' && (
                                    <div>
                                        <p className="rs-section-label">Metadata & Safeguards</p>
                                        <div className="mt-4 grid gap-4">
                                            <input
                                                className="rs-input"
                                                value={wizardState.projectName}
                                                onChange={(event) =>
                                                    setWizardState((current) => ({ ...current, projectName: event.target.value }))
                                                }
                                                placeholder="Project name"
                                            />
                                            <textarea
                                                className="rs-input min-h-[120px] resize-none px-4 py-3"
                                                value={wizardState.summary}
                                                onChange={(event) =>
                                                    setWizardState((current) => ({ ...current, summary: event.target.value }))
                                                }
                                            />
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <button
                                                    className={classNames(
                                                        'rounded-[18px] border px-4 py-3 text-left',
                                                        wizardState.backupRequired
                                                            ? 'border-[rgba(46,211,154,0.18)] bg-[rgba(46,211,154,0.08)] text-white'
                                                            : 'border-[var(--rs-stroke-soft)] bg-white/[0.03] text-[var(--rs-text-secondary)]'
                                                    )}
                                                    onClick={() =>
                                                        setWizardState((current) => ({ ...current, backupRequired: !current.backupRequired }))
                                                    }
                                                >
                                                    Backup required before any release
                                                </button>
                                                <button
                                                    className={classNames(
                                                        'rounded-[18px] border px-4 py-3 text-left',
                                                        wizardState.compatibilityLock
                                                            ? 'border-[rgba(46,211,154,0.18)] bg-[rgba(46,211,154,0.08)] text-white'
                                                            : 'border-[var(--rs-stroke-soft)] bg-white/[0.03] text-[var(--rs-text-secondary)]'
                                                    )}
                                                    onClick={() =>
                                                        setWizardState((current) => ({
                                                            ...current,
                                                            compatibilityLock: !current.compatibilityLock,
                                                        }))
                                                    }
                                                >
                                                    Strict compatibility lock
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button
                                            className="rs-toolbar-button"
                                            onClick={() => {
                                                const currentIndex = ['vehicle', 'stock', 'ecu', 'metadata'].indexOf(wizardStep);
                                                if (currentIndex > 0) {
                                                    setWizardStep(['vehicle', 'stock', 'ecu', 'metadata'][currentIndex - 1] as WizardStep);
                                                }
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                            Back
                                        </button>
                                        <button
                                            className="rs-toolbar-button"
                                            onClick={() => {
                                                const currentIndex = ['vehicle', 'stock', 'ecu', 'metadata'].indexOf(wizardStep);
                                                if (currentIndex < 3) {
                                                    setWizardStep(['vehicle', 'stock', 'ecu', 'metadata'][currentIndex + 1] as WizardStep);
                                                }
                                            }}
                                        >
                                            Next
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </button>
                                    </div>

                                    <button className="rs-toolbar-button rs-button-primary" onClick={completeWizard}>
                                        <span className="material-symbols-outlined text-[18px]">task_alt</span>
                                        Create project
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[18px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-4 py-3">
            <p className="rs-section-label">{label}</p>
            <p className="mt-2 text-sm font-[700] text-white">{value}</p>
        </div>
    );
}

function InspectorGroup({ title, rows }: { title: string; rows: string[][] }) {
    return (
        <div className="rounded-[20px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] p-4">
            <p className="rs-section-label">{title}</p>
            <div className="mt-4 space-y-3">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-[var(--rs-text-secondary)]">{label}</span>
                        <span className="text-right font-[700] text-white">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
