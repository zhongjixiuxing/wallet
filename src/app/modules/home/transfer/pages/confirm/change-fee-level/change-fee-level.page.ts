import { Component, OnInit, Input} from '@angular/core';
import {Router} from '@angular/router';
import {ProfileService} from '../../../../../../services/profile.service';
import {isEmpty} from 'lodash';
import {Logger} from '../../../../../../services/logger/logger';
import {PopupService} from '../../../../../../services/popup.service';
import {FeeService} from '../../../../../../services/fee.service';
import {Coin, WalletModelService} from '../../../../../../models/wallet-model.service';
import {letProto} from 'rxjs-compat/operator/let';

@Component({
    templateUrl: './change-fee-level.page.html',
    styleUrls: ['./change-fee-level.page.scss']
})
export class ChangeFeeLevelPage implements OnInit {
    public levels: any;

    @Input()
    public wallet: WalletModelService;

    @Input()
    public modal: any;

    @Input()
    parent: any;

    @Input()
    callback: string;

    public customFeeValue: number;

    public currentLevel: string;

    public levelFormatValue: string = '80';

    private isOpenSelect: boolean = false;

    public unit: string;

    constructor(
        private router: Router,
        private profileService: ProfileService,
        private logger: Logger,
        private popupService: PopupService,
        private feeService: FeeService
    ) {
    }

    async ngOnInit() {

        let levels;
        try {
            levels = await this.feeService.getFeeLevel(this.wallet.currentCoin);
        } catch (err) {
            this.logger.error(``, err);
            return this.showError('ServerError', 'request fee level');
        }

        this.levels = levels;

        this.currentLevel = this.feeService.getDefaultLevel(this.wallet.currentCoin).level;
        this.unit = this.feeService.getFeeUnit(this.wallet.currentCoin);
    }

    showError(title, message) {
        this.logger.warn(`Invalid path format: ${message}`);
        let opts = {
            header: title,
            message,
            color: 'danger',
            position: 'bottom',
            duration: 200,
        }

        this.popupService.ionicCustomToast(opts);
    }

    close() {
        this.modal.dismiss({level: this.currentLevel});
    }

    change() {
        let result;
        result = {
            level: this.currentLevel
        };

        if (this.currentLevel !== 'custom'){
            result['value'] = this.levels[this.currentLevel];
        } else {
            result['value'] = this.customFeeValue;
        }

        if (result.value <= 0 || !result.value){
            return this.showError('Error', 'invalid custom fee');
        }

        this.parent[this.callback](result);
        this.modal.dismiss(result);
    }

    async openLevelMoal() {
        if (this.isOpenSelect) {
            return;
        }
        try {
            this.isOpenSelect = true;
            let levels: any;
            try {
                levels = await this.feeService.getFeeLevel(this.wallet.currentCoin);
            } catch (err) {
                this.logger.error(``, err);
                return this.showError('ServerError', 'request fee level');
            }

            this.levels = levels;
            let inputs = [];
            let keys = Object.keys(levels);
            for (let i=0; i<keys.length; i++) {
                inputs.push({
                    name: keys[i],
                    type: 'radio',
                    label: keys[i],
                    value: keys[i]
                });
            }

            inputs.push({
                name: 'custom',
                type: 'radio',
                label: 'custom',
                value: 'custom',
            });
            const alert = await this.popupService.ionicCustomAlert({
                header: 'Radio',
                inputs,
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        cssClass: 'secondary',
                        handler: () => {
                            //nothing to do
                        }
                    }, {
                        text: 'Ok',
                        handler: (selected, error) => {
                            if (selected) {
                                this.currentLevel = selected;
                            }
                        }
                    }
                ]
            });

            await alert.present();
        } catch (err) {

        } finally {
            this.isOpenSelect = false;
        }


    }
}
