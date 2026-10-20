import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { errorCode } from '../utils/errors.js';

const tempName = (base: string): string =>
    `${base}.${process.pid}-${crypto.randomBytes(6).toString('hex')}.tmp`;

export const tempPathFor = (target: string): string =>
    path.join(path.dirname(target), tempName(path.basename(target)));

export const writeFileAtomic = async (
    target: string,
    data: string | Buffer
): Promise<void> => {
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const temp = tempPathFor(target);

    try {
        await fs.promises.writeFile(temp, data);
        await fs.promises.rename(temp, target);
    } catch (error) {
        await fs.promises.rm(temp, { force: true });
        throw error;
    }
};

export const publishDirAtomic = async (tempDir: string, target: string): Promise<void> => {
    await fs.promises.mkdir(path.dirname(target), { recursive: true });

    try {
        await fs.promises.rename(tempDir, target);
        return;
    } catch (error) {
        const code = errorCode(error);
        const lostRace = code === 'EEXIST' || code === 'ENOTEMPTY' || code === 'EPERM';
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        if (lostRace && fs.existsSync(target)) return;
        throw error;
    }
};

export const withTempDir = async <T>(
    parent: string,
    fn: (dir: string) => Promise<T>
): Promise<T> => {
    await fs.promises.mkdir(parent, { recursive: true });
    const dir = path.join(parent, tempName('staging'));
    await fs.promises.mkdir(dir, { recursive: true });

    try {
        return await fn(dir);
    } finally {
        await fs.promises.rm(dir, { recursive: true, force: true });
    }
};

export const pathExists = async (target: string): Promise<boolean> => {
    try {
        await fs.promises.access(target);
        return true;
    } catch {
        return false;
    }
};
