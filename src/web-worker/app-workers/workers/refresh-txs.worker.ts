import {WorkerMessage} from '../shared/worker-message.model';
import {CoinCfg, WalletModelService} from '../../../app/models/wallet-model.service';
import {FirstInitBtcWalletWorker} from './first-init-btc-wallet.worker';
import {findIndex, find, isEmpty} from 'lodash';
import {WORKER_TOPIC} from '../shared/worker-topic.constants';
import * as serialize from 'serialize-error';

export class RefreshTxsWorker {
    /**
     * value.data format:
     *     jobId: string 唯一的jobs标识
     *
     *
     * @param {WorkerMessage} value
     * @return {WorkerMessage}
     */
    public static async doWork(value: WorkerMessage, appWorker: any): Promise<WorkerMessage> {
        const reqData: any = value.data;
        let resp = {};
        let wallets = reqData.wallets;


        for (let i=0; i<wallets.length; i++) {
            RefreshTxsWorker.syncTxs(wallets[i], reqData, appWorker);
        }

        return new WorkerMessage(value.topic, resp);
    }

    public static syncTxs(wallet: WalletModelService, reqData: any, appWorker: any) {
        return wallet.coins.forEach((coinCfg: any, coin: any) => {
            switch(coin) {
                case 'BTC':
                    RefreshTxsWorker.syncBtcTxs(wallet, coinCfg, reqData, appWorker);
                    break;

                default:
                    console.warn('Unsupport COIN : ', coin);
                    break;
            }
        })
    }

    public static async syncBtcTxs(wallet: WalletModelService, coinCfg: CoinCfg, reqData: any, appWorker: any) {
        let txs = coinCfg.txs;
        let updateTxs: any = {}; // 有变动的txs
        let lastTs: number = 0;
        if (txs.length >= 10000) {
            lastTs = txs[txs.length - 1].ts;
        }

        let url = `${reqData.btcRpcUrl}/wallet/${wallet.id}`;
        let jumpIndex = 0;
        try {
            while(true) {
                let reqListTxsBody = {
                    jsonrpc: '1.0',
                    id: 'curltest',
                    method: 'listtransactions',
                    // true 代表只获取导入的钱包addresses 的txs, 每次获取1000
                    params: ['*', 1000, jumpIndex, true],
                };

                let listTxsRes: any = await FirstInitBtcWalletWorker.importToRemove(url, reqListTxsBody);
                if (!listTxsRes && listTxsRes.status !== 200 && listTxsRes.error !== null) {
                    throw new Error('[RefreshTxsWorker.listtransactions] Invalid response: ' + JSON.stringify(listTxsRes));
                }

                listTxsRes = await listTxsRes.json();
                if (listTxsRes.result.length === 0) {
                    break;
                }

                for (let i=0; i<listTxsRes.result.length; i++) {
                    let tx = listTxsRes.result[i];
                    if (tx.blocktime < lastTs) {
                        continue;
                    }

                    let localTx = find(txs, (t) => {
                        return t.id === tx.txid;
                    });


                    if (!localTx) {
                        updateTxs[tx.txid] = {
                            ts: tx.blocktime,
                            category: tx.category,
                            label: tx.label,
                            amount: tx.amount,
                            confirmations: tx.confirmations
                        };
                    } else if (localTx.confirmations <= 6) {
                        updateTxs[tx.txid] = {
                            ts: tx.blocktime ? tx.blocktime : parseInt(`${new Date().valueOf() / 1000}`),
                            confirmations: tx.confirmations
                        }
                    } else {
                        // nothing to do
                    }
                }

                jumpIndex += 1000;
            }

            if (!isEmpty(updateTxs)) {
                let resp = {
                    status: null,
                    coin: 'BTC',
                    walletId: wallet.id,
                    updateTxs
                };
                let msg = new WorkerMessage(WORKER_TOPIC.refreshTxs,  resp);

                appWorker.returnWorkResults(msg);
            }
        } catch (err) {
            console.error('[RefreshTxsWorker.syncBtcTxs] error: ', err);
            let resp = {
                status: 'Error',
                error: serialize(err)
            };
            let msg = new WorkerMessage(WORKER_TOPIC.refreshTxs,  resp);

            appWorker.returnWorkResults(msg);
        }
    }

}