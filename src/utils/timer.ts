let startTime: [number, number] | null = null;

export const start = (): void => {
    startTime = process.hrtime();
};

export const stop = (): string => {
    if (startTime === null) {
        throw new Error('timer.stop() called before timer.start()');
    }
    const endTime = process.hrtime(startTime);
    const seconds = endTime[0] + endTime[1] / 1e9;
    return `${parseFloat(seconds.toFixed(2))}s`;
};
