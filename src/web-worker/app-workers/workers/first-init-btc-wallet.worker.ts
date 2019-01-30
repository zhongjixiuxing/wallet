import {WorkerMessage} from '../shared/worker-message.model';

import {payments, networks} from 'bitcoinjs-lib';
import {mnemonicToSeed} from 'bip39';
import {fromSeed} from 'bip32';
import {WORKER_TOPIC} from '../shared/worker-topic.constants';
import * as serialize from 'serialize-javascript';
import {sortBy} from 'lodash';
import BigNumber from 'bignumber.js';

export class FirstInitBtcWalletWorker {
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
        const before = new Date();
        const reqData: any = value.data;

        let seed = mnemonicToSeed(reqData.mnemonic);
        const root = fromSeed(seed);

        let txsMap: Map<string, any> = new Map<string, any>();
        let lastBreakIndex = 0; // 最后的接受地址
        let pIndex = 0;
        let addressMapList: any = {};
        while(true) {
            let addresses = [];
            let formatAddresses = [];
            for (let i=pIndex; i<pIndex + 1000; i++) {
                let path = `m/44'/1'/0'/0/${i}`;
                const account = root.derivePath(path);
                let address = payments.p2pkh({pubkey: account.publicKey, network: networks.testnet}).address;

                addresses.push(address);
                formatAddresses.push({
                    scriptPubKey: {address},
                    timestamp: 0
                })
            }

            let reqBody = {
                jsonrpc: '1.0',
                id: 'curltest',
                method: 'listlabels',
                params: [""]
                // method: 'importmulti',
                // params: [formatAddresses]
            };

            let res = await FirstInitBtcWalletWorker.importToRemove(reqData.url,  reqBody);

            if (res && res.status === 200) {
                let reqWalletInfoBody = {
                    jsonrpc: '1.0',
                    id: 'curltest',
                    method: 'getwalletinfo',
                    params: []
                };

                let txcount = 0; // wallet txcount at the moment;
                let walletInfoRes:any = await FirstInitBtcWalletWorker.importToRemove(reqData.url, reqWalletInfoBody);
                if (walletInfoRes && walletInfoRes.status === 200) {
                    walletInfoRes = await walletInfoRes.json();
                    if (!walletInfoRes || walletInfoRes.error !== null || !walletInfoRes.hasOwnProperty('result') || !walletInfoRes.result.hasOwnProperty('txcount')) {
                        throw new Error('Unexpected BTC getwalletinfo-rpc response : ' + JSON.stringify(walletInfoRes));
                    }

                    txcount = walletInfoRes.result.txcount;
                } else {
                    throw new Error('Unexpected BTC getwalletinfo-rpc response : ' + JSON.stringify(walletInfoRes));
                }

                // 获取当前wallet所有的接受txs
                let receivedTxs: Map<string, string> = new Map<string, string>();
                //  * 200 0 true
                if (txcount > 0) {
                    let count = 1000; // 一次获取1000条tx
                    let jumpIndex = 0; // 跳过tx的下标
                    while(true) {
                        let reqListTxsBody = {
                            jsonrpc: '1.0',
                            id: 'curltest',
                            method: 'listtransactions',
                            params: ['*', count, jumpIndex, true], // true 代表只获取导入的钱包addresses 的txs
                        };

                        let listTxsRes:any = await FirstInitBtcWalletWorker.importToRemove(reqData.url, reqListTxsBody);
                        if (listTxsRes && listTxsRes.status === 200) {
                            listTxsRes = await listTxsRes.json();
                            if (!listTxsRes || listTxsRes.error !== null || !listTxsRes.hasOwnProperty('result')) {
                                throw new Error('Unexpected BTC getwalletinfo-rpc response : ' + JSON.stringify(listTxsRes));
                            }

                            if (listTxsRes.result.length === 0) {
                                break; // 跳出检索txs, 因为尽头了
                            }

                            /*
                                tx item data format :

                                address: "mm9KwsBQp1FbAivs7MB6oQkaRNCyWA1JLW"
                                amount: 0.00194927
                                bip125-replaceable: "no"
                                blockhash: "0000000098607601b4842c5f81d74a2e599d39e8bae08b9e9b17ad9812a04522"
                                blockindex: 20
                                blocktime: 1538903723
                                category: "receive"
                                confirmations: 38226
                                involvesWatchonly: true
                                label: ""
                                time: 1538903723
                                timereceived: 1547795598
                                txid: "08dd2fd4b8b9a23da93498d85f5c92edc47da3ebe4242d20ac44dc91a53c81c9"
                                vout: 0
                            */
                            for (let ii=0; ii<listTxsRes.result.length; ii++) {
                                let tx: any = listTxsRes.result[ii];
                                txsMap.set(tx.txid, {
                                    ts: tx.blocktime,
                                    category: tx.category,
                                    label: tx.label,
                                    amount: tx.amount,
                                    confirmations: tx.confirmations
                                });
                                if (tx.category === 'receive') { // only check receive category tx
                                    receivedTxs.set(tx.address, tx.txid);  //address 为key， txid 为value, 重复覆盖
                                } else if (tx.category === 'send') {
                                } else {
                                    throw new Error('Unknown BTC tx category: '+ JSON.stringify({
                                        category: tx.category,
                                        walletId: reqData.jobId,
                                        txid: tx.txid
                                    }));
                                }
                            }
                        } else {
                            throw new Error('Unexpected BTC getwalletinfo-rpc response : ' + JSON.stringify(walletInfoRes));
                        }

                        jumpIndex += count;
                    }
                }

                if (receivedTxs.size === 0) {// 在1000 条路径附近没有任何的tx, 当为一个没有任何token的新钱包
                    break;
                }


                let breakIndex = pIndex+999;
                for (; breakIndex>=pIndex; breakIndex--) {
                    if (receivedTxs.has(addresses[breakIndex]) ) {
                        break; //
                    }
                }

                if (breakIndex < pIndex) { //在最近1000条路径附近没有任何的tx, 以上一个breakIndex 为最后的index
                    break;
                }

                lastBreakIndex = breakIndex;
                pIndex += 1000; // next 1000 path;

            } else { // Invalid/Error response from remote rpc node
                let now = new Date();
                let body: any = null;
                let status: any = null;
                try {
                    body = await res.json();
                } catch (err) {
                    body = serialize(res);
                    status = WORKER_TOPIC.Error;
                }
                let resBody = {
                    status: res.status,
                    url: res.url,
                    body
                };

                let resp = {
                    status,
                    jobId: reqData.jobId,
                    time : now.valueOf() - before.valueOf(),
                    addresses,
                    res: resBody
                };
                return new WorkerMessage(value.topic,  resp);
            }
        }

        let txsArr = [];
        txsMap.forEach((data, txid) => {
            txsArr.push({id: txid,  ...data});
        });

        txsArr = sortBy(txsArr, [(tx) => {
            return tx.ts;
        }]);

        // 最多保留一万条记录
        txsArr = txsArr.slice(-10000, txsArr.length);

        const lastPath = `m/44'/1'/0'/0/${lastBreakIndex}`;
        const account = root.derivePath(lastPath);
        let address = payments.p2pkh({pubkey: account.publicKey, network: networks.testnet}).address;

        let balance = await FirstInitBtcWalletWorker.calcBalanceForUnspent(reqData.url);

        let now = new Date();
        let resp = {
            status: null,
            jobId: reqData.jobId,
            time: now.valueOf() - before.valueOf(),
            data: {
                lastPath,
                address,
                txsArr,
                balance: balance.toString()
            }
        };

        return new WorkerMessage(value.topic, resp);
    }

    /**
     *
     * @param {string} url
     */
    public static async calcBalanceForUnspent(url: string) {
        // listunspent ( minconf maxconf  ["addresses",...] [include_unsafe] [query_options])
        let unspentBody = {
            jsonrpc: '1.0',
            id: 'curltest',
            method: 'listunspent',
            params: [0, 9999999, [], true]
        };

        let balance = new BigNumber(0);
        let unspentRes: any = await FirstInitBtcWalletWorker.importToRemove(url,  unspentBody);
        if (unspentRes && unspentRes.status === 200) {
            unspentRes = await unspentRes.json();
            if (unspentRes.error !== null) {
                throw new Error('Unexpected BTC listunspent response on worker:' + JSON.stringify(unspentRes));
            }

            for (let i=0; i<unspentRes.result.length; i++) {
                balance = balance.plus(unspentRes.result[i].amount);
            }
        } else {
            throw new Error('Unexpected BTC listunspent response on worker: ' + JSON.stringify(unspentRes));
        }

        return balance;
    }

    public static importToRemove(url: string, data:any) {
        return fetch(url, {
            body: JSON.stringify(data),
            cache: 'no-cache',
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST',
            mode: 'cors'
        })
            // .then(response => response.json()) //parses response to JSON
    }
}