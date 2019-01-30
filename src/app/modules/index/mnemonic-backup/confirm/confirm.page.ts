import {Component, NgZone, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {Location} from "@angular/common";
import {without, join} from "lodash";
import {PersistenceService} from "../../../../services/persistence/persistence";
import {WalletModelService} from "../../../../models/wallet-model.service";
import {Logger} from '../../../../services/logger/logger';
import {PopupService} from '../../../../services/popup.service';

@Component({
  templateUrl: './confirm.page.html',
  styleUrls: ['./confirm.page.scss'],
})
export class MnemonicBkConfirmPage implements OnInit {

    public errors: boolean = false;
    public isVerify: boolean = false;
    public mnemonicWords: Array<String>;
    public clickMnemonicWords: Array<String> = [];

    public newWallet: WalletModelService;

    constructor(
        private router: Router,
        private location: Location,
        protected persistence: PersistenceService,
        private zone: NgZone,
        private logger: Logger,
        private popupService: PopupService
    ) {
        this.init();
    }

    ngOnInit() {
    }


    public async init() {
        let newWallet = await this.persistence.getTempporaryData('newWallet');
        this.newWallet = newWallet;

        if (!newWallet || !newWallet.hasOwnProperty('mnemonic')) {
            this.router.navigate(['/index']);
            return;
        }

        this.mnemonicWords = newWallet.mnemonic.split(' ');
    }

    toggleVerify() {
        this.isVerify = !this.isVerify;
    }


    goback(){
        if (this.isVerify) {
            return this.toggleVerify();
        }

        this.zone.run(() => {
            this.location.back();
        });
    }

    mnemonicWordClick(word){
        this.mnemonicWords = without(this.mnemonicWords, word);

        this.clickMnemonicWords.push(word);
    }

    async verify() {
        let mnemonic = join(this.clickMnemonicWords, ' ');
        if (mnemonic !== this.newWallet.mnemonic) {
            this.errors = true;
            return;
        }

        this.newWallet.isBackup = true;
        if (await this.storageNewWallet()) {
            return;
        }

        this.zone.run(async () => {
            this.router.navigate(['/index/agreement']);
        });
    }

    restartConfirm() {
        this.errors = false;

        this.mnemonicWords = this.newWallet.mnemonic.split(' ');
        this.clickMnemonicWords = [];
    }

    async storageNewWallet() {
        try {
            await this.persistence.setTemporaryData('newWallet', this.newWallet);
        } catch (err) {
            this.logger.error('[Storage new walllet]', err);
            await this.popupService.showIonicCustomErrorAlert(err);

            return err;
        }
    }
}
