export interface NpmPackument {
    name: string;
    'dist-tags': { latest: string; [tag: string]: string };
    versions: Record<string, { version: string; dist: { tarball: string } }>;
    time: { created: string; modified: string; [version: string]: string };
    description?: string;
    license?: string;
    author?: { name?: string } | string;
}
