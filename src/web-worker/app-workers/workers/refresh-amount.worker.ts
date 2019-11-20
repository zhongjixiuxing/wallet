import {WorkerMessage} from '../shared/worker-message.model';

import BigNumber from 'bignumber.js';
import {FirstInitBtcWalletWorker} from './first-init-btc-wallet.worker';
import {WORKER_TOPIC} from '../shared/worker-topic.constants';


export class RefreshAmountWorker {
    /**
     * value.data format:
     *     url: request url,
     *     mnemonic: string, wallet mnemonic words
     *     jobId: string 唯一的jobs标识
     *
     *
     * @param {WorkerMessage} value
     * @return {WorkerMessage}
     */
    public static async doWork(value: WorkerMessage): Promise<WorkerMessage> {
        const reqData: any = value.data;
        const amount = await FirstInitBtcWalletWorker.calcBalanceForUnspent(reqData.url);

        const resp = {
            status: null,
            jobId: reqData.jobId,
            data: {
                reqData,
                amount: amount.toString()
            }
        };

        return new WorkerMessage(WORKER_TOPIC.refreshAmount, resp);
    }
}
