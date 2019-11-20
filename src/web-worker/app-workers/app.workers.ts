import {FirstInitBtcWalletWorker, FullScanWorker, CheckFullScanResultWorker, RefreshAmountWorker} from './workers/index';
import { WorkerMessage } from './shared/worker-message.model';
import { WORKER_TOPIC } from './shared/worker-topic.constants';
import * as serialize from 'serialize-error';
import {RefreshTxsWorker} from './workers/refresh-txs.worker';

export class AppWorkers {
    workerCtx: any;
    created: Date;
    jobs: Map<string, any> = new Map<string, any>();

    constructor(workerCtx: any) {
        this.workerCtx = workerCtx;
        this.created = new Date();
    }

    /**
     * worker gateway 入口
     *
     * Notice:
     *  - data 数据中必须要包含有jobId 属性，用来标识唯一的jobs, 并且在回调的数据中将会返回此属性
     *  - 返回数据中的status 用来标识错误， null代表sucess, String 代表发生错误
     *  - 每种worker job 的返回结果都不同, 具体需要去看相应的job声明文件
     *
     *  @return {Promise<any>}
     */
    async workerBroker($event: MessageEvent): Promise<any> {
        const { topic, data } = $event.data as WorkerMessage;
        try {
            const workerMessage = new WorkerMessage(topic, data);
            if (!workerMessage.data.hasOwnProperty('jobId')) {
                throw new Error('Unknown worker id!');
            }

            if (this.jobs.has(workerMessage.data.jobId)) {
                return;
            }

            this.jobs.set(workerMessage.data.jobId, workerMessage); // add to jobs

            let respWorkerMessage;
            switch (topic) {
                case WORKER_TOPIC.firstInitBtcWallet:
                    respWorkerMessage = await FirstInitBtcWalletWorker.doWork(workerMessage);
                    break;

                case WORKER_TOPIC.refreshTxs:
                    await RefreshTxsWorker.doWork(workerMessage, this);
                    break;

                case WORKER_TOPIC.fullScan:
                    respWorkerMessage = await FullScanWorker.doWork(workerMessage);
                    break;

                case WORKER_TOPIC.checkFullScanResult:
                    respWorkerMessage = await CheckFullScanResultWorker.doWork(workerMessage);
                    break;

                case WORKER_TOPIC.refreshAmount:
                    respWorkerMessage = await RefreshAmountWorker.doWork(workerMessage);
                    break;

                default:  // Add support for other workers here
                    throw new Error('Topic Does Not Match: ' + topic);
            }

            // remove job reference
            this.removeJob(workerMessage.data.jobId);
            if (respWorkerMessage) {
                this.returnWorkResults(respWorkerMessage);
            }

        } catch (err) {
            console.error('workerBroker error: ', err);

            let res: any;
            if (err.hasOwnProperty('message') && err.message === 'Unknown worker id!') {
                res = {
                    jobId: null,
                    status: WORKER_TOPIC.Error,
                    error: serialize(err)
                };
            } else {
                res = {
                    jobId: data.jobId,
                    status: WORKER_TOPIC.Error,
                    error: serialize(err)
                };

                this.removeJob(res.jobId);
            }

            res.topic = topic;
            let errorWorkerMessage = new WorkerMessage(topic, res);
            this.returnWorkResults(errorWorkerMessage);
        }
    }


    /***
     * remove job reference
     *
     * @param {string} jobId
     */
    private removeJob(jobId: string) {
        if (this.jobs.has(jobId)) {
            this.jobs.delete(jobId);
        }
    }

    private returnWorkResults(message: WorkerMessage): void {
        this.workerCtx.postMessage(message);
    }
}
