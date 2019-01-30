import {Component, Input, NgZone, OnInit} from '@angular/core';
import {PopupService} from '../../../../../../../services/popup.service';
import {TranslateService} from '@ngx-translate/core';
import {ProfileService} from '../../../../../../../services/profile.service';
import {Logger} from '../../../../../../../services/logger/logger';
import {Router} from '@angular/router';

@Component({
  templateUrl: './delete-warning.page.html',
  styleUrls: ['./delete-warning.page.scss']
})
export class DeleteWarningPage implements OnInit {


    @Input()
    parent

    constructor(
        private zone: NgZone,
        private popupService: PopupService,
        private translate: TranslateService,
        private profileService: ProfileService,
        private logger: Logger,
        private router: Router

    ) {}

    ngOnInit() {
    }

    back() {
        this.zone.run(async () => {
            await this.parent.modals.delete_warning.dismiss();
        });
    }

    showConfirmAlert() {
        let alertText = this.translate.instant('onboarding-pages.slides.password-alert');
        let opts = {
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
                       this.back();
                    }
                }, {
                    text: alertText.btn_confirm,
                    handler: () => {
                        this.deleteWallet();
                    }
                }
            ]
        };

        this.popupService.ionicCustomAlert(opts);
    }

    async deleteWallet(){
        let walletId = this.parent.wallet.id;
        try {
            await this.profileService.deleteWallet(walletId);
        } catch (err) {
            this.logger.error('[Delete walllet]', err);
            await this.popupService.showIonicCustomErrorAlert(err);
        }

        this.back();
        this.router.navigateByUrl('/home');
    }

}
