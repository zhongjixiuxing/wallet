import {Component, NgZone, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {WalletModelService, Coin} from '../../../../../models/wallet-model.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ProfileService} from '../../../../../services/profile.service';
import {isEmpty, sortBy} from 'lodash';
import {Logger} from '../../../../../services/logger/logger';
import {PopupService} from '../../../../../services/popup.service';
import {RateService} from '../../../../../services/rate.service';
import {ModalController} from '@ionic/angular';
import {ChangeFeeLevelPage} from './change-fee-level/change-fee-level.page';
import {FeeService} from '../../../../../services/fee.service';
import {WalletService} from '../../../../../services/wallet.service';
import BigNumber from 'bignumber.js';
import * as Bitcoin from 'bitcoinjs-lib';
import {SuccessPage} from './success/success.page';




@Component({
    templateUrl: './confirm.page.html',
    styleUrls: ['./confirm.page.scss']
})
export class ConfirmPage implements OnInit {

    wallet: WalletModelService;
    recipient: string;
    amount: string = '0';
    usdAmount: string = '0';
    level: any;
    oldFeeRate: any;
    fee: number = 0;
    memo: string = '';
    private isInit: boolean = false;
    private sending: boolean = false;
    private tx: any;

    constructor(
        private location: Location,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private profileService: ProfileService,
        private logger: Logger,
        private popupService: PopupService,
        private rateService: RateService,
        private modalCtrl: ModalController,
        private feeService: FeeService,
        private ngZone: NgZone,
        private walletService: WalletService
    ) {
    }

    async ngOnInit() {
        let loader = await this.popupService.ionicCustomLoading({});
        try {
            let queryParams = this.activatedRoute.snapshot.queryParams;
            this.recipient = queryParams['recipient'];
            let walletId = this.activatedRoute.snapshot.params.id;
            let amount = queryParams['amount'];
            let usdAmount = queryParams['usdAmount'];

            if (isEmpty(this.recipient)) {
                this.logger.error(`invalid recipient: ${this.recipient}`);
                return this.showError('Error', 'Invalid recipient', '/home');
            }

            if (isEmpty(walletId)) {
                this.logger.error(`[Transfer Module] invalid walletId: ${walletId}`);
                return this.showError('Error', 'Invalid walletid', '/home');
            }

            if (parseFloat(`${amount}`) <= 0 || parseFloat(`${usdAmount}`) <= 0) {
                this.logger.error(`invalid query params: ${JSON.stringify(queryParams)}`);
                return this.showError('Error', 'invalid query params', '/home');
            }

            let wallets = this.profileService.getWallet(walletId);
            if (!wallets || wallets.length !== 1) {
                this.logger.error(`[Transfer Module] invalid walletId: ${walletId}`);
                return this.showError('Error', 'Invalid walletid', '/home');
            }

            this.amount = amount;
            this.usdAmount = usdAmount;
            this.wallet = wallets[0];
            this.level = await this.feeService.getDefaultLevel(this.wallet.currentCoin);
            let levels = await this.feeService.getBtcFeeLevel();
            this.level.value = levels[this.level.level];

            await this.init();
        } catch (err) {
            this.logger.error('[ConfirmPage.ngOnInit] error: ', err);
            this.showError('Error', 'Unknow error', '/home/'+this.activatedRoute.snapshot.params.id);
        } finally {
            if (loader) {
                await loader.dismiss();
            }
        }
    }

    showError(title, message, redirectTo) {
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

    goback() {
        this.ngZone.run(() => {
            this.router.navigate([`/home/transfer/${this.wallet.id}/enter_amount`], {
                queryParams: {
                    recipient: this.recipient
                }
            })
        })
    }

    async openModal(type: string = 'changeFee') {
        let modal;

        switch (type) {
            case 'changeFee':
                this.oldFeeRate = this.level.value;
                modal = await this.modalCtrl.create({
                    component: ChangeFeeLevelPage,
                    componentProps: {
                        parent: this,
                        wallet: this.wallet,
                        modal,
                        callback: 'changeLevel'
                    }
                });
                break;

            case 'paySuccess':
                modal = await this.modalCtrl.create({
                    component: SuccessPage,
                    backdropDismiss: false,
                    componentProps: {
                        id: this.wallet.id,
                        modal
                    }
                });
                break;

            default:
                throw new Error('unknown modal type: ' + type);
        }

        await modal.present();
    }

    /**
     *
     * @param data
     *  level: string
     */
    changeLevel(data) {
        this.level = data;
        if (this.level.value !== this.oldFeeRate) {
            this.init(); // 费率改变了，重新初始化
        }
    }

    /**
     * 发送transaction
     *
     */
    async send() {
        if (!this.tx || this.sending) {
            return;
        }

        this.sending = true;
        let loader;
        try {
            loader = await this.popupService.ionicCustomLoading({});
            let txHex = this.tx.toHex();
            let result = await this.walletService.sendrawtransaction(this.wallet, txHex);
            loader.dismiss();
            loader = null;

            if (result.status === 200 && result.body.error === null) {
                let txid = result.body.result;
                let tx = {
                    id: txid,
                    ts: parseInt(`${new Date().valueOf() / 1000}`),
                    category: 'send',
                    label: this.memo,
                    amount: -new BigNumber(this.amount).toNumber(),
                    confirmations: 0
                };

                let coinCfg = this.wallet.coins.get(Coin.BTC);
                coinCfg.txs.push(tx);

                this.profileService.event$.next({
                    event: 'NexTxs',
                    data: {tx}
                });

                await this.profileService.storageProfile();
                this.openModal('paySuccess');
            } else {
                this.logger.error(`[ConfirmPage.send] un-support sendrawtransaction response body: `, result);
            }
        } catch (err) {
            this.logger.error(`[ConfirmPage.send] error: `, err);
        } finally {
            this.sending = false;
            if (loader) {
                loader.dismiss();
            }
        }
    }

    async init() {
        /**
         * 1.0  获取unspent 最新的 txs
         * 1.1  根据balance、ts排序 unspent txs
         * 1.2  确定input txs
         * 1.3  create tx
         * 1.4  统计费用, fee = (n_inputs * 148 + n_outputs * 34 + 10) * price_per_byte
         *      费用参考链接：
         *          https://bitzuma.com/posts/making-sense-of-bitcoin-transaction-fees/
         *          https://zhuanlan.zhihu.com/p/38479785
         * 1.5  判断转账金额+fee是否大于wallet amount, 是提示并返回修改
         * 1.6  building and broadcast to blockchain network
         */
        if (this.isInit) {
            return;
        }

        let loader;
        try {
            this.isInit = true;
            loader = await this.popupService.ionicCustomLoading({});

            let totalAvailableAmount = new BigNumber(0); //总共可用的余额

            // 1.1
            let unspentTxs = await this.walletService.listBtcUnspentTxs(this.wallet);
            if (!unspentTxs.hasOwnProperty('body') || unspentTxs.body.error !== null) {
                this.error('Invalid listBtcUnspentTxs res: ', unspentTxs);
                return;
            }
            unspentTxs = unspentTxs.body.result;


            // 1.2 (这种方案属于 老币、大额优先的原则)
            // unspentTxs = sortBy(unspentTxs, ['balance', 'confirmations']);
            unspentTxs = sortBy(unspentTxs, function (tx) {
                let temp = new BigNumber(tx.amount);
                temp = temp.times(tx.confirmations);

                totalAvailableAmount = totalAvailableAmount.plus(tx.amount);
                return parseFloat(temp.toFixed(5));
            });
            // sortBy 后， unspentTxs 的排序为正序, 调整为逆序
            unspentTxs.reverse();

            let inputTxs = [];
            let inputAmount = new BigNumber(0);

            for (let i = 0; i < unspentTxs.length; i++) {
                let tx = unspentTxs[i];
                inputAmount = inputAmount.plus(tx.amount);
                inputTxs.push(tx);

                if (inputAmount.gt(this.amount)) {
                    let tempFee: any = this.calcFee(inputTxs.length, 2);
                    tempFee = new BigNumber(tempFee.dividedBy(100000000).toFixed(8)); // 化为btc， 并保留8位小数

                    let tempTotalUsing = tempFee.plus(this.amount);
                    if (inputAmount.gte(tempTotalUsing)) {
                        this.fee = tempFee.toNumber();
                        break; //已经够了
                    }
                }
            }

            // check 是否是金额不足
            let useAmount = inputAmount.plus(this.fee);
            if (this.fee === 0 || (inputTxs.length === unspentTxs.length && useAmount.gt(totalAvailableAmount))) {
                this.showInsufficientFunds();
            }

            let outputs:any = [{
                address: this.recipient,
                amount: this.btcToSatoshis(this.amount)
            }];
            if (inputAmount.gt(this.amount)) {
                // 默认的change address (找零地址)
                // TODO 给出选择权比用户, 默认是首地址为找零地址
                let tempAddr = await this.wallet.createAddress('m/44\'/1\'/0\'/0/0', Coin.BTC);

                outputs.push({
                    address: tempAddr,
                    amount: this.btcToSatoshis(inputAmount.minus(this.amount).minus(this.fee).toString())
                });
            }

            this.tx = await this.createTx(inputTxs, outputs);
        } catch (err) {
            this.error('send error: ', err);
            this.tx = null; //清空tx
        } finally {
            this.isInit = false;
            if(loader) {
                loader.dismiss();
            }
        }
    }

    btcToSatoshis(amount: any) {
        let amountBN = new BigNumber(amount);
        amountBN = amountBN.times(100000000);

        return amountBN.toNumber();
    }

    async createTx(inputs, outputs){
        const txb = new Bitcoin.TransactionBuilder(Bitcoin.networks.testnet);

        /*
        {
            "<address>": {
                path: string,
                privKey: privKey
            }
        }
        */
        let inputPathMap = await this.walletService.getBtcWalletAddressPath(this.wallet, inputs.map((input) => {
            return input.address;
        }));


        for (let i=0; i<inputs.length; i++) {
            let iTx = inputs[i];
            txb.addInput(iTx.txid, iTx.vout);
        }

        for (let i=0; i<outputs.length; i++) {
            txb.addOutput(outputs[i].address, outputs[i].amount);
        }


        for (let i=0; i<inputs.length; i++) {
            let ecpair = Bitcoin.ECPair.fromPrivateKey(inputPathMap[inputs[i].address].privKey, {
                network: Bitcoin.networks.testnet
            });

            txb.sign(i, ecpair);
        }

        return txb.build();
    }

    showInsufficientFunds() {
        let opts = {
            backdropDismiss: false,
            header: 'Insufficient Funds',
            message: '请尝试减少转账金额, 然后再次重试.',
            mode: 'ios',
            buttons: [
                {
                    text: 'OK',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        this.goback();
                    }
                }
            ]
        };

        this.popupService.ionicCustomAlert(opts);
    }

    calcFee(inputTxsSize: number, outputTxsSize: number): BigNumber {
        let byteFee = new BigNumber(this.level.value / 1000); // 这是1000, 不是kb的1024.

        return byteFee.times(inputTxsSize * 148 + outputTxsSize * 34 + 10);
    }

    error(msg, ...params) {
        this.logger.error(`[Transfer] [ConfirmPage] ${msg}`, ...params);
    }
}
