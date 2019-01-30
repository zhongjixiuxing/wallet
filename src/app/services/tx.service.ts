/***
 * 负责处理各类Token 的transaction
 *
 */

import {Injectable} from '@angular/core';
import {ProfileService} from './profile.service';
import {Logger} from './logger/logger';
import {WalletModelService, Coin} from '../models/wallet-model.service';
import {HttpClientService} from './http-client.service';
import {WalletService} from './wallet.service';

@Injectable({
    providedIn: 'root'
})
export class TxService{

    // key 的格式为 {Wallet.id}-{Coin}
    private syncTxJobs: Map<string, any> = new Map<string, any>();

    constructor(
        private profileService: ProfileService,
        private logger: Logger,
        private walletService: WalletService
    ) {
    }

    async syncTx(wallet: WalletModelService, coin: Coin) {
        let jobId = `${wallet.id}-${coin}`;
        if (this.syncTxJobs.has(jobId)) {
            return;
        }

        this.syncTxJobs.set(jobId, true);
        try {
            switch (coin) {
                case Coin.BTC:
                    await this.syncBtcTxs(wallet);
                    break;

                default:
                    this.logger.error('[TxService] [syncTx] un-support Coin: ' + coin);
                    return;
            }
        } catch (e) {
            this.logger.error('[TxService] [syncTx] error: ', e);
        } finally {
            this.syncTxJobs.delete(jobId);
        }
    }

    async syncBtcTxs(wallet: WalletModelService) {
        console.log('yser------------------sdfs------------');
        // params: ['*', count, skipIndex, true], // true 代表只获取导入的钱包addresses 的txs
        let params = ['*', 50, 0, true];

        let res = await this.walletService.getBtcTxs(wallet, params);
        console.log('res ------------- : ', res);
    }


}
