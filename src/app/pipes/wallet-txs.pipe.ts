
import { Pipe, PipeTransform } from '@angular/core';
import {WalletModelService} from '../models/wallet-model.service';
import {groupBy} from 'lodash';

/*
 * Raise the value exponentially
 * Takes an coin argument that defaults to wallet.currentCoin.
 * Usage:
 *   wallet | walletTxs:Coin? | async
 * Example:
 *   {{ wallet | walletTxs:'BTC' }}
 *   {{ wallet | walletTxs }}
 *   formats to: 1024
*/
@Pipe({name: 'walletTxs'})
export class WalletTxsPipe implements PipeTransform {

    transform(wallet: WalletModelService, coin?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (!coin) {
                coin = wallet.currentCoin;
            }

            let coinCfg: any = wallet.coins.get(coin);
            if (!coinCfg) {
                return [];
            }

            let groupTxs = groupBy(coinCfg.txs, (tx) => {
                let now = new Date();
                let date = new Date(tx.ts * 1000);

                let title = '';
                let mouth = date.toLocaleString('en-us',{month: 'long'});
                if (date.getFullYear() !== now.getFullYear()) {
                    title = `${mouth} [${date.getFullYear()}]`
                } else {
                    title = `${mouth}`;
                }

                return title;
            });

            let result = [];
            let keys = Object.keys(groupTxs);
            for (let i=0; i<keys.length; i++) {
                result.push({
                    month: keys[i],
                    txs: groupTxs[keys[i]]
                })
            }

            resolve(result);
        });
    }
}