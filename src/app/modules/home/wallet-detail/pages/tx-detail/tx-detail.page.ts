import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {PopupService} from '../../../../../services/popup.service';
import {isEmpty} from 'lodash';
import {ProfileService} from '../../../../../services/profile.service';
import {WalletService} from '../../../../../services/wallet.service';
import {Logger} from '../../../../../services/logger/logger';
import * as TxDecoder from 'bitcoin-txdecoder';
import BigNumber from 'bignumber.js';
const {networks} = require("bitcoinjs-lib")

@Component({
  templateUrl: './tx-detail.page.html',
  styleUrls: ['./tx-detail.page.scss']
})
export class TxDetailPage implements OnInit {
    wallet: WalletModelService;
    tx: any;
    txDetail: any;
    coin: string;

    fee: any;
    totalInputAmount: any;
    totalOutputAmount: any;

    constructor(
        private activedRoute: ActivatedRoute,
        private popupService: PopupService,
        private profileService: ProfileService,
        private walletService: WalletService,
        private logger: Logger,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ngZone: NgZone
    ) {
        let params = this.activatedRoute.snapshot.params;
        this.coin = params.coin;

        let wallet: any = this.profileService.getWallet(params.id);

        if (wallet.length === 0) {
            this.showErrorAlert('Invalid Wallet ID', '', '/home');
            return;
        }
        wallet = wallet[0];
        this.wallet = wallet;

        let tx = wallet.coins.get(params.coin).txs.find((tx => tx.id === params.txid));

        if (!tx) {
            this.showErrorAlert('Invalid TX ID', '', '/home/wallet/' + params.id);
            return;
        }

        this.tx = tx;
    }

    async ngOnInit() {
        let loader;
        let totalInputAmount = new BigNumber(0);
        let totalOutputAmount = new BigNumber(0);
        try {
            let txDetailRes = await this.walletService.getTx(this.wallet, this.tx.id);
            if (txDetailRes.status === 200 && txDetailRes.body.error === null) {
                this.txDetail = txDetailRes.body.result;
                const txd: any = new TxDecoder(this.txDetail.hex, networks.testnet);
                this.txDetail.txd = txd;

                for (let i=0; i< txd.inputs.length; i++) {
                    let input = txd.inputs[i];

                    let inputTxRes = await this.walletService.getTx(this.wallet, input.txid);
                    if (inputTxRes.status !== 200 || inputTxRes.body.error !== null) {
                        throw new Error('Invalid response: ' + JSON.stringify(inputTxRes));
                    }

                    let inputTxHex = inputTxRes.body.result.hex;
                    const inputTxd: any = new TxDecoder(inputTxHex, networks.testnet);

                    totalInputAmount = totalInputAmount.plus(inputTxd.outputs[input.n].satoshi);
                }
                this.totalInputAmount = totalInputAmount.dividedBy(100000000).toString();

                for (let i=0; i<txd.outputs.length; i++) {
                    let output = txd.outputs[i];

                    totalOutputAmount = totalOutputAmount.plus(output.satoshi);
                }
                this.totalOutputAmount = totalOutputAmount.dividedBy(100000000).toString();

                let fee = totalInputAmount.minus(totalOutputAmount).dividedBy(100000000);
                this.fee = fee.toString();
            }

        } catch (err) {
            this.logger.error('[TxDetailPage.ngOnInit] error: ', err);
            this.showErrorAlert('Unknown error', err.message, '/home/wallet/' + this.wallet.id);
        } finally {
            if (loader) {
                loader.dismiss();
            }
        }
    }

    async showErrorAlert(header, message, redirectTo) {
        let opts = {
            backdropDismiss: false,
            header,
            message,
            mode: 'ios',
            buttons: [
                {
                    text: 'OK',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        this.ngZone.run(() => {
                            this.router.navigate([redirectTo]);
                        });
                    }
                }
            ]
        };

        this.popupService.ionicCustomAlert(opts);
    }

    goback() {
        this.ngZone.run(() => {
            this.router.navigate([`/home/wallet/${this.wallet.id}`]);
        })
    }
}