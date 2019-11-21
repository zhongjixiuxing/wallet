import {Component, OnInit, ChangeDetectorRef, NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {PersistenceService} from '../../../services/persistence/persistence';
import {Coin, CoinCfg, WalletModelService} from '../../../models/wallet-model.service';
import {PopupService} from '../../../services/popup.service';
import {ProfileService} from '../../../services/profile.service';
import * as uuid from 'uuid/v4';
import {Logger} from '../../../services/logger/logger';
import {HttpClientService} from '../../../services/http-client.service';
import {WalletService} from '../../../services/wallet.service';


@Component({
    selector: 'app-agreement',
    templateUrl: './agreement.page.html',
    styleUrls: ['./agreement.page.scss'],
})
export class AgreementPage implements OnInit {
    provisionItem1: boolean = false;
    provisionItem2: boolean = false;
    provisionItem3: boolean = false;

    finalProvision: boolean = false;
    protected newWallet: WalletModelService;

    constructor(private popupService: PopupService,
                private persistence: PersistenceService,
                private router: Router,
                private changeRef: ChangeDetectorRef,
                private zone: NgZone,
                private logger: Logger,
                private walletService: WalletService,
                private profileService: ProfileService) {
        this.changeRef.markForCheck();
        this.init();
    }


    ngOnInit() {
    }

    async init() {
        let newWallet = await this.persistence.getTempporaryData('newWallet');
        if (!newWallet || !newWallet.hasOwnProperty('mnemonic')) {
            this.router.navigate(['/index']);
            return;
        }

        this.newWallet = newWallet;
        return;
    }

    async confirm() {
        const options = {
            spinner: 'lines',
            message: 'Please wait...',
            translucent: true
        };

        const loading = await this.popupService.ionicCustomLoading(options);

        try {
            await this.init();
            this.newWallet.id = uuid();
            this.newWallet.name = 'my-first-wallet';

            const hash = WalletModelService.getSoleHash(this.newWallet.mnemonic);

            let res;
            try {
                res = await this.walletService.getWalletInfoBySoleHash(hash, this.newWallet.name, this.newWallet.id);
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
                res = await this.walletService.initWalletFirstCoin(this.newWallet);
            } catch (e) {
                this.logger.error(`[CreateWalletPage] createNewWallet initWalletFirstCoin error`, e);
                this.alertError('Unknown Error');
                return;
            }

            if (!res || (res.body.err !== HttpClientService.Errors.OK)) {
                return;
            }

            const path = res.body.data.path;
            res = await this.walletService.updateScanFlag(this.newWallet, Coin.BTC, path, {app: {
                    DuplicateRequest: () => { // 忽略默认的重复弹框处理
                        return true;
                    }
                }});

            if (res.body.err !== null && res.body.err !== 'DuplicateRequest') {
                this.logger.error('[CreateWalletPage] [createNewWallet] [updateScanFlag] error: ', {
                    res: res.body,
                    walletId: this.newWallet.id,
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

            this.newWallet.coins.set(this.newWallet.currentCoin, coinCfg);
            this.newWallet.createAddress(this.newWallet.currentPath, this.newWallet.currentCoin, {updateCurrentPath: true, updateCurrentAddress: true});

            await this.walletService.importBtcAddressToRemote(this.newWallet, this.newWallet.currentReceiveAddress)


            this.profileService.addWallet(this.newWallet);
            this.profileService.setIsInit(true);
            await this.profileService.storageProfile();

            await this.persistence.removeTemporaryData('newWallet');

            await this.zone.run(async () => {
                await loading.dismiss();
                return this.router.navigate(['/home']);
            });
        } catch (err) {
            loading.dismiss();
            this.logger.error('[Agreement Error]', err);
            await this.popupService.showIonicCustomErrorAlert(err);
        }
    }

    public async storageNewWallet() {
        try {
            await this.persistence.setTemporaryData('newWallet', this.newWallet);
        } catch (err) {
            this.logger.error('[Storage new walllet]', err);
            await this.popupService.showIonicCustomErrorAlert(err);

            return err;
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
