import axios from 'axios';
import logger from 'simple-node-logger';
import * as dotenv from 'dotenv';
dotenv.config();
class RescueTimeAPIError extends Error {
}
export class RescueTimeAPI {
    constructor(jobName = 'No Job Name') {
        this.jobName = jobName;
        this.logger = logger.createSimpleLogger('logs/rescue-time-api.log');
        this.RESCUE_TIME_BASE_URL = 'https://www.rescuetime.com/anapi';
        this.RESCUE_TIME_HIGHLIGHTS_URL = '/highlights_feed';
        this.logger.log('info', `${jobName}: starting Notion logger`);
    }
    async getRescueTimeHighlights() {
        var _a;
        try {
            const resp = await axios.get(this.RESCUE_TIME_BASE_URL + this.RESCUE_TIME_HIGHLIGHTS_URL, {
                params: {
                    key: (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.RESCUE_TIME_TOKEN,
                },
            });
            if (resp.status !== 200) {
                throw new RescueTimeAPIError('error fetching highlights');
            }
            return resp.data;
        }
        catch (err) {
            this.logger.log('error', 'RescueTimeAPI [getRescueTimeHighlights]' + err);
            return [];
        }
    }
}
export default RescueTimeAPI;
