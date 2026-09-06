export interface PackageJson {
    name?: string;
    version?: string;
    description?: string;
    main?: string;
    license?: string;
    keywords?: string[];
    scripts?: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
}
