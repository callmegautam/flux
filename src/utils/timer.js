let startTime = null;

export const start = () => {
    startTime = process.hrtime();
};

export const stop = () => {
    const endTime = process.hrtime(startTime);
    const seconds = endTime[0] + endTime[1] / 1e9;
    return `${parseFloat(seconds.toFixed(2))}s`;
};
