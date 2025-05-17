import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';

export const info = async (packageName) => {
    const packageInfo = await fetchPackageInformation(packageName);
    console.log(`\n${packageName}`);
    console.log(`Version: ${packageInfo['dist-tags'].latest}`);
    console.log(`Description: ${packageInfo.description}`);
    console.log(`Author: ${packageInfo.author.name}`);
    console.log(`License: ${packageInfo.license}`);
    console.log(`Published: ${packageInfo.time.created}`);
    console.log(`Updated: ${packageInfo.time.modified}`);
};
