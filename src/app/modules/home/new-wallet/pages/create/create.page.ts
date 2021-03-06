import {Component, NgZone, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import * as _ from "lodash";
import {PopupService} from '../../../../../services/popup.service';
import {Router} from '@angular/router';
import {ProfileService} from '../../../../../services/profile.service';
import {Coin, CoinCfg, WalletModelService} from '../../../../../models/wallet-model.service';
import {WalletService} from '../../../../../services/wallet.service';
import {TranslateService} from '@ngx-translate/core';
import * as uuid from 'uuid/v4';
import {HttpClientService} from '../../../../../services/http-client.service';
import {Logger} from '../../../../../services/logger/logger';
import {c} from 'tar';

@Component({
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
})
export class CreatePage implements OnInit {
    finalProvision: boolean = false;
    data: any = {
      name: {
        errors: false,
        value: null
      },
      serverUrl: {
        value: null
      }
    }


    showAdvanced: boolean = false;

    wallet: WalletModelService;

  constructor(
      private popupService: PopupService,
      private zone: NgZone,
      private router: Router,
      private profileService: ProfileService,
      private walletService: WalletService,
      private translate: TranslateService,
      private logger: Logger,
  ) {

  }

  ngOnInit() {
  }

    goback() {
        this.zone.run(() => {
            this.router.navigate(['/home/new_wallet/index']);
        })
    }

    nameFocus(){
      this.data.name.errors = false;
    }

    nameBlur(){
      if (_.isEmpty(this.data.name.value)){
        this.data.name.errors = true;
      }
    }

    async create() {
        if (_.isEmpty(this.data.name.value)) {
          return ;
        }

        let options = {
            spinner: 'lines',
            message: 'Please wait...',
            translucent: true
        };

        let loading = await this.popupService.ionicCustomLoading(options);

        this.wallet = this.walletService.createWallet();

        this.wallet.name = this.data.name.value;

        await this.zone.run(async () => {
            await loading.dismiss();

            let alertText = this.translate.instant('app');
            let passwordAlertText = this.translate.instant('home.new_wallet.create.pwd_alert');

            let pwdConfirmOptions = {
                backdropDismiss: false,
                header: passwordAlertText.title,
                message: '<p style="color: #ff5722">'+passwordAlertText.subtitle+'</p>',
                mode: 'ios',
                buttons: [
                    {
                        text: alertText.no,
                        role: 'cancel',
                        cssClass: 'secondary',
                        handler: () => {
                            this.showCancelConfirmAlert();
                        }
                    }, {
                        text: alertText.yes,
                        handler: () => {
                            this.showPasswordAlert();
                        }
                    }
                ]
            };

            this.popupService.ionicCustomAlert(pwdConfirmOptions);
        });
    }

    showPasswordAlert(passwordValue = '', confirmPasswordValue = '') {
        let appTranslate = this.translate.instant('app');
        let passwordAlertText = this.translate.instant('home.new_wallet.create.pwd_input_alert');

        let options = {
            backdropDismiss: false,
            header: passwordAlertText.title,
            message: `<p style="color: #ff5722;">${passwordAlertText.subtitle}</p>`,
            mode: 'ios',
            inputs: [
                {
                    name: 'password',
                    type: 'password',
                    placeholder: appTranslate.pwd.placeholder,
                    value: passwordValue
                },
                {
                    name: 'password_confirm',
                    type: 'password',
                    placeholder: appTranslate.pwd.confirm_placeholder,
                    value: confirmPasswordValue
                }
            ],
            buttons: [
                {
                    text: appTranslate.cancel,
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                      this.showCancelConfirmAlert();
                    }
                }, {
                    text: appTranslate.confirm,
                    handler: async (inputsValue) => {
                        let password = inputsValue.password.trim();
                        let confirmPassword = inputsValue.password_confirm.trim();
                        let tempErrInfos = {
                            color: 'danger',
                            message: "error",
                            position: 'bottom',
                            duration: 2000
                        };

                        if (_.isEmpty(password)) {
                            tempErrInfos.message = appTranslate.pwd.errors.empty;
                            this.popupService.ionicCustomToast(tempErrInfos);
                            return false;
                        }

                        if (password.length < 6) {
                            tempErrInfos.message = appTranslate.pwd.errors.size;
                            this.popupService.ionicCustomToast(tempErrInfos);
                            return false;
                        }

                        if (password !== confirmPassword) {
                            tempErrInfos.message = appTranslate.pwd.errors.not_equal;
                            this.popupService.ionicCustomToast(tempErrInfos);
                            return false;
                        }

                        this.wallet.password = password;
                        this.createNewWallet();
                    }
                }
            ]
        }

        this.popupService.ionicCustomAlert(options);
    }

    showCancelConfirmAlert() {
        let appTranslate = this.translate.instant('app');
        let alertText = this.translate.instant('home.new_wallet.create.confirm_cancel_alert');

        let options = {
            backdropDismiss: false,
            header: alertText.title,
            message: `<p style="color: #ff5722;">${alertText.subtitle}</p>`,
            mode: 'ios',
            buttons: [
                {
                    text: appTranslate.goback,
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        this.showPasswordAlert();
                    }
                }, {
                    text: appTranslate.i_am_sure,
                    handler: async () => {
                        this.createNewWallet();
                    }
                }
            ]
        }

        this.popupService.ionicCustomAlert(options);
    }

    async createNewWallet(){
        this.wallet.id = uuid();

        const hash = WalletModelService.getSoleHash(this.wallet.mnemonic);

        let res;
        try {
            res = await this.walletService.getWalletInfoBySoleHash(hash, this.wallet.name, this.wallet.id);
        } catch (err) {
            // nothing to do here
            this.logger.error(`[CreateWalletPage] createNewWallet error`, err);
            this.alertError('Unknown Error');
            return;
        }

        if (!res || (res.body.err !== HttpClientService.Errors.OK)) {
            return;
        }

        try {
            res = await this.walletService.initWalletFirstCoin(this.wallet);
        } catch (e) {
            this.logger.error(`[CreateWalletPage] createNewWallet initWalletFirstCoin error`, e);
            this.alertError('Unknown Error');
            return;
        }

        if (!res || (res.body.err !== HttpClientService.Errors.OK)) {
            return;
        }

        const path = res.body.data.path;
        res = await this.walletService.updateScanFlag(this.wallet, Coin.BTC, path, {app: {
                DuplicateRequest: () => { // 忽略默认的重复弹框处理
                    return true;
                }
            }});

        if (res.body.err !== null && res.body.err !== 'DuplicateRequest') {
            this.logger.error('[CreateWalletPage] [createNewWallet] [updateScanFlag] error: ', {
                res: res.body,
                walletId: this.wallet.id,
                coin: Coin.BTC,
            });

            this.alertError('Unknown Error');
            return;
        }

        const coinCfg = new CoinCfg({
            currentPath: path,
            currentReceiveAddress: null,
            isFirstFullScan: true,
        });

        this.wallet.coins.set(this.wallet.currentCoin, coinCfg);
        this.wallet.createAddress(this.wallet.currentPath, this.wallet.currentCoin, {updateCurrentPath: true, updateCurrentAddress: true});


        await this.walletService.importBtcAddressToRemote(this.wallet, this.wallet.currentReceiveAddress)

        this.profileService.addWallet(this.wallet);
        await this.profileService.storageProfile();
        return this.router.navigate(['/home/wallet/' + this.wallet.id]);
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
