import { readFile } from 'fs/promises';
import path from 'path';

export interface PlatformVersion {
    name: string;
    version: string;
    status: 'active' | 'beta';
    highlights: string[];
}

async function readVersionFromPackageJson(packagePath: string, fallback = 'unknown'): Promise<string> {
    try {
        const raw = await readFile(packagePath, 'utf8');
        const pkg = JSON.parse(raw) as { version?: string };
        return pkg.version || fallback;
    } catch {
        return fallback;
    }
}

export async function getPlatformVersions(): Promise<PlatformVersion[]> {
    const repoRoot = path.resolve(process.cwd(), '..');

    const [webVersion, mobileVersion, desktopVersion] = await Promise.all([
        readVersionFromPackageJson(path.join(process.cwd(), 'package.json'), '0.1.0'),
        readVersionFromPackageJson(path.join(repoRoot, 'mobile', 'package.json'), '1.0.0'),
        readVersionFromPackageJson(path.join(repoRoot, 'desktop', 'package.json'), '2.4.1'),
    ]);

    return [
        {
            name: 'Web Cloud',
            version: webVersion,
            status: 'beta',
            highlights: ['Marketplace discovery', 'Account + purchase flows', 'Creator/admin dashboards'],
        },
        {
            name: 'Mobile App',
            version: mobileVersion,
            status: 'active',
            highlights: ['Bluetooth ECU workflow', 'Flash wizard + recovery', 'Garage + tune management'],
        },
        {
            name: 'Desktop Pro',
            version: desktopVersion,
            status: 'active',
            highlights: ['Workbench + diagnostics', 'Map editor + flash manager', 'Batch queue + recovery tools'],
        },
    ];
}
