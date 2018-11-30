import {Component, OnInit, ChangeDetectorRef, NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {PersistenceService} from '../../../services/persistence/persistence';
import {WalletModelService} from '../../../models/wallet-model.service';
import {PopupService} from '../../../services/popup.service';
import {ProfileService} from '../../../services/profile.service';
import * as uuid from 'uuid/v4';
import {Logger} from '../../../services/logger/logger';


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
                private profileService: ProfileService) {
        this.changeRef.markForCheck();
        this.init();
    }


    ngOnInit() {
    }

    public async init() {
        let newWallet = await this.persistence.getTempporaryData('newWallet');
        if (!newWallet || !newWallet.hasOwnProperty('mnemonic')) {
            this.router.navigate(['/index']);
            return;
        }

        this.newWallet = newWallet;
    }

    async confirm() {
        try {
            this.newWallet.id = uuid();

            this.profileService.addWallet(this.newWallet);
            this.profileService.setIsInit(true);
            await this.profileService.storageProfile();

            let options = {
                spinner: 'lines',
                message: 'Please wait...',
                translucent: true
            };

            let loading = await this.popupService.ionicCustomLoading(options);

            await this.persistence.removeTemporaryData('newWallet');

            await this.zone.run(async () => {
                await loading.dismiss();
                return this.router.navigate(['/home']);
            });
        } catch (err) {
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

}
