import fs from 'fs';
import { config } from '../config.js';
import { mapLimit } from '../utils/limit.js';
import { getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type { ResolutionGraph, ResolvedPackage } from '../resolver/resolve.js';
import { extractPackage, hasPackage } from './packages.js';
import { fetchTarball, tarballPath } from './tarballs.js';

const materializeOne = async (pkg: ResolvedPackage, useFluxRegistry: boolean): Promise<void> => {
    if (await hasPackage(pkg.integrity)) return;

    const tarball = await fetchTarball(pkg, { useFluxRegistry });

    try {
        await extractPackage(pkg.integrity, tarball);
    } catch (error) {
        logger.warning(
            `Cached tarball for ${pkg.id} could not be extracted, re-downloading: ${getErrorMessage(error)}`
        );
        await fs.promises.rm(tarballPath(pkg.integrity), { force: true });
        const fresh = await fetchTarball(pkg, { useFluxRegistry });
        await extractPackage(pkg.integrity, fresh);
    }
};

export const materialize = async (
    graph: ResolutionGraph,
    options: { useFluxRegistry?: boolean } = {}
): Promise<{ downloaded: number }> => {
    const packages = [...graph.packages.values()];
    const failedOptional: string[] = [];
    let downloaded = 0;

    await mapLimit(packages, config.networkConcurrency, async (pkg) => {
        try {
            if (await hasPackage(pkg.integrity)) return;
            await materializeOne(pkg, options.useFluxRegistry ?? false);
            downloaded++;
        } catch (error) {
            if (!pkg.optional) throw error;
            logger.warning(`Skipping optional package ${pkg.id}: ${getErrorMessage(error)}`);
            failedOptional.push(pkg.id);
        }
    });

    for (const id of failedOptional) graph.packages.delete(id);

    for (const pkg of graph.packages.values()) {
        for (const [depName, depId] of Object.entries(pkg.dependencies)) {
            if (!graph.packages.has(depId)) delete pkg.dependencies[depName];
        }
    }

    for (const [name, id] of Object.entries(graph.roots)) {
        if (!graph.packages.has(id)) delete graph.roots[name];
    }

    return { downloaded };
};
