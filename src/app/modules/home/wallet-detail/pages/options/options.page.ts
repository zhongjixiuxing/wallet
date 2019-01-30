import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';
import {ModalController, IonContent, Platform} from '@ionic/angular';
import {DeleteWarningPage} from './modals/delete-warning/delete-warning.page';
import {Location} from '@angular/common';
import {parseInt} from 'lodash';
import {CreateAddressPage} from './modals/create-address/create-address.page';
import {Logger} from '../../../../../services/logger/logger';

@Component({
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss']
})
export class OptionsPage implements OnInit {

    @ViewChild(IonContent) content: IonContent;


    wallet: WalletModelService;

    modals: any = {}

    labelShow: boolean = false;

    labelOpts: any = {
        opacity: 1,
        fontSize: 25
    }

    constructor(
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router,
        private activedRoute: ActivatedRoute,
        private modalCtrl: ModalController,
        private location: Location,
        private platform: Platform,
        private ngZone: NgZone,
        private logger: Logger
    ) {
    }

    ngOnInit() {
        let walletid = this.router.url.match(/wallet\/.*\/options/i);
        if (!walletid) {
            return this.showInvalidWalletToast();
        }

        let splits = walletid[0].split('/');
        if (splits.length !== 3) {
            return this.showInvalidWalletToast();
        }
        let wallets = this.profileService.getWallet(splits[1]);
        if (wallets.length !== 1) {
            return this.showInvalidWalletToast();
        }

        this.wallet = wallets[0];
    }

    showInvalidWalletToast() {
        let opts = {
            message: "Invalid Wallet[ID]!",
            color: 'danger',
            position: 'bottom',
            duration: 3000
        }

        this.popupService.ionicCustomToast(opts);
        this.router.navigate(['/home']);
    }

    async presentModal(type) {
        let modal = null;
        switch (type) {
            case 'delete_warning':
                modal = await this.modalCtrl.create({
                    component: DeleteWarningPage,
                    componentProps: { parent: this }
                });

                this.modals.delete_warning = modal;
                await modal.present();
            break;

            case 'create_address':
                modal = await this.modalCtrl.create({
                    component: CreateAddressPage,
                    componentProps: { parent: this, callback: 'createAddress', modal }
                });

                this.modals.create_address = modal;
                await modal.present();
                break;

            default:
                this.logger.error(`[OptionsPage.presentModal] un-support type: ` + type);
        }
    }

    goback() {
        this.ngZone.run(() => {
            this.location.back();
        });
    }

    onScroll(event){
        let startY = event.detail.currentY;
        let topHeight = this.platform.height() * 0.13;
        let safeHeight = topHeight;

        if (startY > safeHeight) {
            this.labelShow = true;
        } else {
            this.labelShow = false;
        }

        let ratio = 1 - (startY / safeHeight);
        let fontSize: number = 25;
        let opacity = 1;

        if (ratio < 1 && ratio > 0) {
            fontSize = fontSize * ratio;
            opacity  = opacity * ratio;

            if (fontSize < 12) {
                fontSize = 12;
            }
        }

        this.labelOpts.fontSize = parseInt(`${fontSize}`);
        this.labelOpts.opacity = opacity;
    }

    createAddress(address) {
        this.wallet.addRecipient(address);
        this.profileService.storageProfile();
    }
}
