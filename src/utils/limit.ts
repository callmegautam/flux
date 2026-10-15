export type Limit = <T>(fn: () => Promise<T>) => Promise<T>;

export const createLimit = (concurrency: number): Limit => {
    if (concurrency < 1) throw new RangeError('concurrency must be at least 1');

    let active = 0;
    const queue: Array<() => void> = [];

    const next = (): void => {
        active--;
        const resume = queue.shift();
        if (resume) resume();
    };

    return <T>(fn: () => Promise<T>): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            const run = (): void => {
                active++;
                void (async () => {
                    try {
                        resolve(await fn());
                    } catch (error) {
                        reject(error);
                    } finally {
                        next();
                    }
                })();
            };

            if (active < concurrency) run();
            else queue.push(run);
        });
    };
};

export const mapLimit = async <T, R>(
    items: readonly T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
    const limit = createLimit(concurrency);
    return Promise.all(items.map((item, index) => limit(() => fn(item, index))));
};
