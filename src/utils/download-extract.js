import { config } from '../config.js';
import axios from 'axios';
import path from 'path';
import * as tar from 'tar';

export const downloadAndExtract = async (packageName, version) => {
    const tarballUrl = `${config.registry}${packageName}/-/${packageName}-${version}.tgz`;

    const response = await axios({
        url: tarballUrl,
        responseType: 'stream',
    });

    await new Promise((resolve, reject) => {
        response.data
            .pipe(tar.x({ C: path.join(process.cwd(), 'node_modules', packageName), strip: 1 }))
            .on('finish', resolve)
            .on('error', reject);
    });
};
