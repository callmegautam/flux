export interface NpmDist {
    tarball: string;
    shasum?: string;
    integrity?: string;
}

export interface NpmPackument {
    name: string;
    'dist-tags': { latest: string; [tag: string]: string };
    versions: Record<string, { version: string; dist: NpmDist }>;
    time: { created: string; modified: string; [version: string]: string };
    description?: string;
    license?: string;
    author?: { name?: string } | string;
}

export type PackageBin = string | Record<string, string>;

export interface AbbreviatedVersion {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    bin?: PackageBin;
    os?: string[];
    cpu?: string[];
    deprecated?: string;
    dist: NpmDist;
}

export interface AbbreviatedPackument {
    name: string;
    'dist-tags': Record<string, string>;
    versions: Record<string, AbbreviatedVersion>;
    modified?: string;
}
