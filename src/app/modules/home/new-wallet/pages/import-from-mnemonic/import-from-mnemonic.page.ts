import {Component, NgZone, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {isEmpty} from 'lodash';
import {PopupService} from '../../../../../services/popup.service';
import {Router} from '@angular/router';
import {ProfileService} from '../../../../../services/profile.service';
import {Coin, CoinCfg, WalletModelService} from '../../../../../models/wallet-model.service';
import {WalletService} from '../../../../../services/wallet.service';
import {TranslateService} from '@ngx-translate/core';
import * as uuid from 'uuid/v4';
import {Logger} from '../../../../../services/logger/logger';
import {HttpClientService} from '../../../../../services/http-client.service';

@Component({
    templateUrl: './import-from-mnemonic.page.html',
    styleUrls: ['./import-from-mnemonic.page.scss'],
})
export class ImportFromMnemonicPage implements OnInit {
    data: any = {
        mnemonic: {
            errors: false,
            value: null
        },
        serverUrl: {
            value: null
        }
    }

    showAdvanced: boolean = false;

    isImporting: boolean = false;

    constructor(private location: Location,
                private popupService: PopupService,
                private zone: NgZone,
                private router: Router,
                private profileService: ProfileService,
                private walletService: WalletService,
                private ngZone: NgZone,
                private logger: Logger,
                private translate: TranslateService) {
    }

    ngOnInit() {
    }

    goback() {
        this.ngZone.run(() => {
            this.location.back();
        });
    }

    inputFocus(type: string) {
        this.data[type].errors = false;
    }

    inputBlur() {
        if (isEmpty(this.data.mnemonic.value)) {
            this.data.mnemonic.errors = true;
        }
    }

    async import() {
        if (this.isImporting) {
            return ; // importing
        }

        let loading;
        try {
            let isNewWallet: boolean = false;
            this.isImporting = true;
            loading = await this.popupService.ionicCustomLoading({});

            let mnemonic = this.data.mnemonic.value;
            if (isEmpty(mnemonic) || !WalletModelService.validMnemonic(mnemonic)) {
                this.data.mnemonic.errors = true;
                return;
            }

            let hash = WalletModelService.getSoleHash(mnemonic);
            let wallet = new WalletModelService({mnemonic});
            wallet.id = uuid();

            let res;
            try {
                res = await this.walletService.getWalletInfoBySoleHash(hash, '', wallet.id);
            } catch (err) {
                // nothing to do here
                console.error(err); // only output to console
            }

            if (!res || (res.body.err !== HttpClientService.Errors.OK)) {
                return;
            }


            let resData = res.body.data;
            if (wallet.id !== resData.id) {
                isNewWallet = true;
            }

            // 以服务器上面的name为准
            wallet.id = resData.id;
            wallet.name = resData.name;

            // check wallet has exists on local
            let tempWallet = this.profileService.getWallet(wallet.id);
            if (tempWallet.length > 0) {
                let opts = {
                    backdropDismiss: false,
                    header: 'Wallet has exists on local',
                    message: '',
                    mode: 'ios',
                    buttons: [
                        {
                            text: 'OK',
                            role: 'cancel',
                            cssClass: 'secondary',
                            handler: () => {
                                this.ngZone.run(() => {
                                    this.router.navigate([`/home/wallet/${wallet.id}`]);
                                });
                            }
                        }
                    ]
                };

                return this.popupService.ionicCustomAlert(opts);
            }

            try {
                res = await this.walletService.getRemoteWalletDetail(wallet.id);
            } catch (err) {
                // nothing to do here
                console.error(err); // only output to console
            }

            if (!res || (res.body.err !== HttpClientService.Errors.OK)) {
                return;
            }

            let detailData = res.body.data;
            if (isEmpty(detailData.coins)) {
                res = await this.walletService.initWalletFirstCoin(wallet);

                if (!res || (res.body.err !== HttpClientService.Errors.OK)) {
                    return;
                }

                let coinCfg = new CoinCfg({
                    currentPath: res.body.data.path,
                    currentReceiveAddress: null
                });

                wallet.coins.set(wallet.currentCoin, coinCfg);
                wallet.createAddress(wallet.currentPath, wallet.currentCoin, {updateCurrentPath: true, updateCurrentAddress: true});
            } else {
                wallet.currentCoin= detailData.coins[0].coin;
                wallet.currentPath = detailData.coins[0].path;
                wallet.currentReceiveAddress = wallet.createAddress(wallet.currentPath, wallet.currentCoin, {updateCurrentPath: false, updateCurrentAddress: false});

                for(let i=0; i<detailData.coins.length; i++) {
                    let coin = detailData.coins[i];
                    let coinCfg = new CoinCfg(coin);
                    wallet.coins.set(coin.coin, coinCfg);
                }
            }

            let isWalletExists: boolean = false;
            try {
                res = await this.walletService.importWallet(wallet, {status: {
                        500: (err:any) => {
                            if (err.hasOwnProperty('error') && err.error
                                && err.error.hasOwnProperty('error') && err.error.error
                            ) {
                                let errorInfo = err.error.error;
                                if (errorInfo.hasOwnProperty('code') && errorInfo.code === -4
                                    && errorInfo.hasOwnProperty('message')
                                    && errorInfo.message.indexOf(`Wallet ${wallet.id} already exists.`) !== -1
                                ) {
                                    isWalletExists = true;
                                    return true;
                                }
                            }

                            return false;
                        }
                    }});
            } catch (err) {
                if (!isWalletExists) { // only watch wallet exists event on here
                    return;
                }
            }

            res = null; // reset res variable
            try {
                res = await this.walletService.loadWallet(wallet, {status: {
                        500: (err: any) => {
                            // check has loaded ?
                            if (err.hasOwnProperty('error') && err.error
                                && err.error.hasOwnProperty('error') && err.error.error
                            ) {
                                let errorInfo = err.error.error;
                                if (errorInfo.hasOwnProperty('code') && errorInfo.code === -4
                                    && errorInfo.hasOwnProperty('message')
                                    && errorInfo.message.indexOf(`Duplicate -wallet filename specified.`) !== -1
                                ) {
                                    return true;
                                }
                            }
                        }
                    }});
            } catch (err) {
                // nothing to do here
            }

            res = null;
            res = await this.walletService.importBtcAddressToRemote(wallet, wallet.currentReceiveAddress);

            if (!res.hasOwnProperty('body') || !res.body || !res.body.hasOwnProperty('error') || !res.body.error === null) {
                throw new Error('[importBtcAddressToRemote] invalid response format : ' + JSON.stringify(res));
            }

            this.profileService.addWallet(wallet);
            await this.profileService.storageProfile();
            if (isNewWallet) {
                this.walletService.firstInit(wallet); // 第一次初始化(async);
            }

            return this.ngZone.run(() => {
                this.router.navigate([`/home/wallet/${wallet.id}`]);
            });
        } catch (e) {
            this.logger.error('import-from-mnemonic error: ', e);
            this.alertError('Unknown Error');
        } finally {
            this.isImporting = false;
            if (loading) {
                loading.dismiss();
            }
        }
    }

    alertError(text: string) {
        let opts = {
            backdropDismiss: false,
            header: 'Error',
            message: text,
            mode: 'ios',
            buttons: [
                {
                    text: 'OK',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        // nothing to do
                    }
                }
            ]
        };

        this.popupService.ionicCustomAlert(opts);
    }
}
