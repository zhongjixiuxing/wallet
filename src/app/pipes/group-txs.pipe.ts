
import { Pipe, PipeTransform } from '@angular/core';
import {WalletModelService} from '../models/wallet-model.service';
import {groupBy} from 'lodash';

/*
 * Raise the value exponentially
 * Takes an coin argument that defaults to wallet.currentCoin.
 * Usage:
 *   txs | groupTxs | async
 * Example:
 *   {{ txs | groupTxs' | async }}
 *   {{ txs | groupTxs | async}}
 *   formats to: 1024
*/
@Pipe({name: 'groupTxs'})
export class GroupTxsPipe implements PipeTransform {

    transform(txs): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            let groupTxs = groupBy(txs, (tx) => {
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
                    txs: groupTxs[keys[i]].reverse()
                })
            }

            resolve(result.reverse());
        });
    }
}