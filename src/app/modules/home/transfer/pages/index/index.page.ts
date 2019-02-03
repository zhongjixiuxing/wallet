import {Component, NgZone, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router';
import {ProfileService} from '../../../../../services/profile.service';
import {isEmpty} from 'lodash';
import {Logger} from '../../../../../services/logger/logger';
import {PopupService} from '../../../../../services/popup.service';
import {HttpClient} from '@angular/common/http';
import {RateService} from '../../../../../services/rate.service';
import {BigNumber} from 'bignumber.js';

@Component({
    templateUrl: './index.page.html',
    styleUrls: ['./index.page.scss']
})
export class IndexPage implements OnInit {

    wallet: WalletModelService;

    recipient: string;

    amount: string = '0';

    usdAmount: string = '0';

    currentRate: any;

    isReverse: boolean = false;

    canNext: boolean = false;

    private rate: BigNumber

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private profileService: ProfileService,
        private logger: Logger,
        private popupService: PopupService,
        private rateService: RateService,
    ) {
    }

    enterNum(num) {
        let type  = 'amount';
        if (this.isReverse) {
            type ='usdAmount';
        }

        if (num === '.' && this[type].indexOf('.') !== -1) {
            return ;
        }

        if (this[type] === '0') {
            this[type] = num;
        } else {
            this[type] = `${this[type]}${num}`;
        }

        if (this[type] === '.') {
            this[type] = '0.';
        }

        this.calulateAmount();
    }

    deleteOneWorld() {
        let type  = 'amount';
        if (this.isReverse) {
            type ='usdAmount';
        }

        if (!this[type] || this[type].length === 0 || this[type] === '0') {
            return;
        }

        this[type] = this[type].substr(0, this[type].length - 1);

        if (this[type] === '.' || isEmpty(this[type])) {
            this[type] = '0';
        }

        this.calulateAmount();
    }

    async calulateAmount() {
        if (!this.rate) {
            try {
                let temp: any = await this.rateService.getRateByNomics(`${this.wallet.currentCoin}`);
                if (!temp) {
                    return this.showError('ServerError', 'get rate error', '/home');
                }

                this.rate = new BigNumber(temp.price);
            } catch (err) {
                this.logger.error('Get rate error: ', err);
                return this.showError('ServerError', 'get rate error', '/home');
            }
        }

        if (!this.isReverse) {
            let usdAmount = this.rate.times(this.amount);
            this.usdAmount = `${usdAmount.toString()}`
        } else {
            let temp = new BigNumber(this.usdAmount);
            let amount = temp.div(this.rate);
            this.amount = amount.toFixed(5);
        }

        if (parseFloat(`${this.amount}`) > 0) {
            this.canNext = true;
        } else {
            this.canNext = false;
        }
    }

    ngOnInit() {
        this.recipient = this.activatedRoute.snapshot.queryParams['recipient'];
        let walletId = this.activatedRoute.snapshot.params.id;

        if (isEmpty(this.recipient)) {
            this.logger.error(`invalid recipient: ${this.recipient}`);
            return this.showError('Error', 'Invalid recipient', '/home');
        }

        if (isEmpty(walletId)) {
            this.logger.error(`[Transfer Module] invalid walletId: ${walletId}`);
            return this.showError('Error', 'Invalid walletid', '/home');
        }

        let wallets = this.profileService.getWallet(walletId);
        if (!wallets || wallets.length !== 1) {
            this.logger.error(`[Transfer Module] invalid walletId: ${walletId}`);
            return this.showError('Error', 'Invalid walletid', '/home');
        }

        this.wallet = wallets[0];

        this.calulateAmount(); // 提早获取汇率
    }

    showError(title, message, redirectTo) {
        this.logger.warn(`Invalid path format: ${message}`);
        let opts = {
            header: title,
            message,
            color: 'danger',
            position: 'bottom',
            duration: 200,
        };

        this.popupService.ionicCustomToast(opts);
    }

    next() {
        if (parseFloat(`${this.amount}`) <= 0) {
            return;
        }

        let balance = new BigNumber(this.wallet.amount);
        if (balance.lte(this.amount)) {
            return this.showError('Error', 'Insufficient money', './');
        }

        this.router.navigate([`/home/transfer/${this.wallet.id}/confirm`], {
            queryParams: {
                amount: this.amount,
                usdAmount: this.usdAmount,
                recipient: this.recipient
            }
        });
    }
}