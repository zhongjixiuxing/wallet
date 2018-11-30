import { Component, ViewChild, Inject,  NgZone} from '@angular/core';
import {Slides} from '@ionic/angular';
// import {Slides, App} from 'ionic-angular';
import {Router} from "@angular/router";
import {WalletService} from "../../../services/wallet.service";
import {WalletModelService} from "../../../models/wallet-model.service";
import {TranslateService} from "@ngx-translate/core";
import * as _ from "lodash";
import {PersistenceService} from "../../../services/persistence/persistence";
import {PopupService} from "../../../services/popup.service";
import {Logger} from '../../../services/logger/logger';

@Component({
  selector: 'index-slides',
  templateUrl: 'slides.page.html',
  styleUrls: ['slides.page.scss']
})
export class IndexSlidesPage {
    @ViewChild('slides') slides: Slides;

    slideOpts = {
        effect: 'flip',
        zoom: {
            toggle: false,
        },
        setWrapperSize: false
    };

    private _wallet: WalletModelService;

    constructor(
        private router: Router,
        private walletService: WalletService,
        private translate: TranslateService,
        private persistence: PersistenceService,
        private zone: NgZone,
        private popupService: PopupService,
        private logger: Logger
    ) {

    }

    async next() {
        if (await this.slides.isEnd()) {
            return this.createWallet();
        }

        this.slides.slideNext(500);
    }

    async slidePrev() {
        if (await this.slides.isBeginning()) {
            return this.router.navigate(['/index']);
        }
        this.slides.slidePrev(500);
    }

    skip() {
        this.router.navigate(['/index/agreement']);
    }



    async createWallet() {
        this._wallet = this.walletService.createWallet();

        if (await this.storageNewWallet()) {
            return;
        }

        let alertText = this.translate.instant('onboarding-pages.slides.password-alert');
        let options = {
            backdropDismiss: false,
            header: alertText.title,
            message: alertText.text,
            mode: 'ios',
            buttons: [
                {
                    text: alertText.btn_cancel,
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        this.zone.run(async () => {
                            await this.router.navigate(['/index/email_setting']);
                        });
                    }
                }, {
                    text: alertText.btn_confirm,
                    handler: () => {
                        this.showPasswordAlert();
                    }
                }
            ]
        };

        this.popupService.ionicCustomAlert(options);
    }

    async showPasswordAlert(passwordValue = '', confirmPasswordValue = '') {
        let passwordAlertText = this.translate.instant('onboarding-pages.slides.password-alert.createAlert');

        let options = {
            backdropDismiss: false,
            header: passwordAlertText.title,
            message: `<p style="color: red;">${passwordAlertText.text}</p>`,
            mode: 'ios',
            inputs: [
                {
                    name: 'password',
                    type: 'password',
                    placeholder: 'Password',
                    value: passwordValue
                },
                {
                    name: 'password_confirm',
                    type: 'password',
                    placeholder: 'Password Confirm',
                    value: confirmPasswordValue
                }
            ],
            buttons: [
                {
                    text: passwordAlertText.btn_cancel,
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        // no thing to do
                    }
                }, {
                    text: passwordAlertText.btn_confirm,
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
                            tempErrInfos.message = 'Password can not be empty!!!';
                            this.popupService.ionicCustomToast(tempErrInfos);
                            return false;
                        }

                        if (password.length < 6) {
                            tempErrInfos.message = 'Password size must be greater than or equal 6.';
                            this.popupService.ionicCustomToast(tempErrInfos);
                            return false;
                        }

                        if (password !== confirmPassword) {
                            tempErrInfos.message = 'Password and Confirm password not equal!!!';
                            this.popupService.ionicCustomToast(tempErrInfos);
                            return false;
                        }

                        this._wallet.password = password;
                        if (await this.storageNewWallet()) {
                            return;
                        }

                        this.zone.run(async () => {
                            await this.router.navigate(['/index/email_setting']);
                        });
                    }
                }
            ]
        }

        this.popupService.ionicCustomAlert(options);
    }

    public async storageNewWallet() {
        try {
            await this.persistence.setTemporaryData('newWallet', this._wallet);
        } catch (err) {
            this.logger.error('[Storage new walllet]', err);
            await this.popupService.showIonicCustomErrorAlert(err);

            return err;
        }
    }
}
