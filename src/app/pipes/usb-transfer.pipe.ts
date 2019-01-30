
import { Pipe, PipeTransform } from '@angular/core';
import {WalletModelService} from '../models/wallet-model.service';
import BigNumber from 'bignumber.js';
import {RateService} from '../services/rate.service';
/*
 * Raise the value exponentially
 * Takes an coin argument that defaults to wallet.currentCoin.
 * Usage:
 *   wallet:amount | walletAmountToUSD:wallet:coin | async
 * Example:
 *   {{ 2 | walletAmountToUSD:'BTC' }}
 *   {{ wallet | walletAmountToUSD }}
 *   formats to: 1024
*/
@Pipe({name: 'walletAmountToUSD'})
export class UsbTransferPipe implements PipeTransform {

    constructor(private rateService: RateService){

    }

    transform(value: any, coin: WalletModelService|string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
                if (value instanceof WalletModelService) {
                    if (typeof coin != 'string') {
                        coin = value.currentCoin;
                    }

                    value = value.amount;
                }

                if (coin instanceof WalletModelService) {
                    coin = coin.currentCoin;
                }

                let rate: any = await this.rateService.getRateByNomics(`${coin}`);

                let amount: BigNumber = new BigNumber(value);
                amount = amount.times(rate.price);

                resolve(`${amount.toFixed(3)}`);
        });
    }
}