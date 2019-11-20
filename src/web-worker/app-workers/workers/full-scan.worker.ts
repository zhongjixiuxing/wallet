import {WorkerMessage} from '../shared/worker-message.model';

import {payments, networks} from 'bitcoinjs-lib';
import {mnemonicToSeed} from 'bip39';
import {fromSeed} from 'bip32';
import {WORKER_TOPIC} from '../shared/worker-topic.constants';
import * as serialize from 'serialize-javascript';
import {FirstInitBtcWalletWorker} from './first-init-btc-wallet.worker';

export class FullScanWorker {
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
        const before = new Date();

        const seed = mnemonicToSeed(reqData.cfg.mnemonic);
        const root = fromSeed(seed);

        const pIndex = reqData.cfg.startIndex;
        const endIndex = reqData.cfg.endIndex;
        const formatAddresses = [];
        for (let i = pIndex; i < pIndex + endIndex; i++) {
            const path = `m/44'/1'/0'/0/${i}`;
            const account = root.derivePath(path);
            const address = payments.p2pkh({pubkey: account.publicKey, network: networks.testnet}).address;

            formatAddresses.push({
                scriptPubKey: {address},
                timestamp: 0
            });
        }

        let reqBody = {
            jsonrpc: '1.0',
            id: 'curltest',
            method: 'importmulti',
            params: [formatAddresses, {rescan: false}],
        };

        const res = await FirstInitBtcWalletWorker.importToRemote(reqData.url,  reqBody);
        if (!res || res.status !== 200) {
            const now2 = new Date();
            let body: any = null;
            let status: any = null;
            try {
                body = await res.json();
            } catch (err) {
                body = serialize(res);
                status = WORKER_TOPIC.Error;
            }
            const resBody = {
                status: res.status,
                url: res.url,
                body
            };

            const resp2 = {
                status,
                jobId: reqData.jobId,
                time : now2.valueOf() - before.valueOf(),
                res: resBody
            };

            return new WorkerMessage(value.topic, resp2);
        }

        reqBody = {
            jsonrpc: '1.0',
            id: 'curltest',
            method: 'rescanblockchain',
            params: [],
        };
        FirstInitBtcWalletWorker.importToRemote(reqData.url,  reqBody);

        const now = new Date();
        const resp = {
            status: null,
            jobId: reqData.jobId,
            time: now.valueOf() - before.valueOf(),
            data: {
                reqData,
            }
        };
        return new WorkerMessage(WORKER_TOPIC.fullScan, resp);
    }
}
