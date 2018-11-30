import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';
import {ModalController} from '@ionic/angular';
import {DeleteWarningPage} from './modals/delete-warning.page';
import {Location} from '@angular/common';

@Component({
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss']
})
export class OptionsPage implements OnInit {

    wallet: WalletModelService;

    modals: any = {}

    constructor(
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router,
        private activedRoute: ActivatedRoute,
        private modalCtrl: ModalController,
        private location: Location
    ) {
    }

    ngOnInit() {
        let params = this.activedRoute.snapshot.params;
        let wallets = this.profileService.getWallet(params.id);

        if (wallets.length !== 1) {
            let opts = {
                message: "Invalid Wallet[ID]!",
                color: 'danger',
                position: 'bottom',
                duration: 3000
            }

            this.popupService.ionicCustomToast(opts);
            return this.router.navigate(['/home']);
        }

        this.wallet = wallets[0];
    }


    async presentModal(type) {
        switch (type) {
            case 'delete_warning':
                const modal = await this.modalCtrl.create({
                    component: DeleteWarningPage,
                    componentProps: { parent: this }
                });

                this.modals.delete_warning = modal;
                await modal.present();
            break;

            default:
                console.error("un-support modal type : " + type);
        }
    }

    goback() {
        this.location.back();
    }
}
