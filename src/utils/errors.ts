export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export class FluxError extends Error {
    readonly code: string;

    constructor(message: string, code = 'FLUX_ERROR') {
        super(message);
        this.name = 'FluxError';
        this.code = code;
    }
}

export const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
    error instanceof Error && typeof (error as NodeJS.ErrnoException).code === 'string';

export const errorCode = (error: unknown): string | undefined =>
    isErrnoException(error) ? error.code : undefined;
