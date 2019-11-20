import {WorkerMessage} from '../shared/worker-message.model';

import {payments, networks} from 'bitcoinjs-lib';
import {mnemonicToSeed} from 'bip39';
import {fromSeed} from 'bip32';
import {WORKER_TOPIC} from '../shared/worker-topic.constants';
import * as serialize from 'serialize-javascript';
import {FirstInitBtcWalletWorker} from './first-init-btc-wallet.worker';
import {findIndex, find, isEmpty} from 'lodash';

export class CheckFullScanResultWorker {
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
        try {
            const reqData: any = value.data;
            let jumpIndex = reqData.cfg.startIndex;
            const startIdx = reqData.cfg.startIndex;
            const endIdx = reqData.cfg.endIndex;

            const url = reqData.url;
            let lastIdx = -1;
            let lastPath = null;

            const seed = mnemonicToSeed(reqData.cfg.mnemonic);
            const root = fromSeed(seed);

            const addresses: Map<string, any> = new Map<string, any>();
            for (let i = startIdx; i < startIdx + endIdx; i++) {
                const path = `m/44'/1'/0'/0/${i}`;
                const account = root.derivePath(path);
                const address = payments.p2pkh({pubkey: account.publicKey, network: networks.testnet}).address;

                addresses.set(address, {path, index: i});
            }

            while (true) {
                const reqListTxsBody = {
                    jsonrpc: '1.0',
                    id: 'curltest',
                    method: 'listtransactions',
                    // true 代表只获取导入的钱包addresses 的txs, 每次获取1000
                    params: ['*', 1000, jumpIndex, true],
                };

                let listTxsRes: any = await FirstInitBtcWalletWorker.importToRemote(url, reqListTxsBody);
                if (!listTxsRes && listTxsRes.status !== 200 && listTxsRes.error !== null) {
                    throw new Error('[CheckFullScanResultWorker.listtransactions] Invalid response: ' + JSON.stringify(listTxsRes));
                }

                listTxsRes = await listTxsRes.json();
                if (listTxsRes.result.length === 0) {
                    break;
                }

                for (let i = 0; i < listTxsRes.result.length; i++) {
                    const tx = listTxsRes.result[i];
                    if (!addresses.has(tx.address)) {
                        continue;
                    }

                    const t = addresses.get(tx.address);
                    if (t.index > lastIdx) {
                        lastIdx = t.index;
                        lastPath = t.path;
                    }
                }

                jumpIndex += 1000;
            }

            let state = 'continue';
            if (lastIdx === -1) {
                state = 'finished';
            }

            const resp = {
                status: null,
                result: {
                    state,
                    lastIdx,
                    lastPath,
                    reqData
                }
            };

            return new WorkerMessage(WORKER_TOPIC.checkFullScanResult,  resp);
        } catch (err) {
            console.error('[CheckFullScanResultWorker.syncBtcTxs] error: ', err);
            const resp = {
                status: 'Error',
                error: serialize(err)
            };
            return new WorkerMessage(WORKER_TOPIC.checkFullScanResult,  resp);
        }
    }
}
