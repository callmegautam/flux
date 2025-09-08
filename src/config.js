import path from "path";

export const config = {
    registry: "https://registry.npmjs.org/",
    cacheDirectory: ".flux-cache",
    cachePath: path.join(process.cwd().slice(0, 2), ".flux-store"),
    backendAPI: "http://api.gautamsuthar.in/flux/api/v1",
};
