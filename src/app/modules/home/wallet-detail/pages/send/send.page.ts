import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';
import {DeleteWarningPage} from '../options/modals/delete-warning/delete-warning.page';
import {CreateAddressPage} from '../options/modals/create-address/create-address.page';
import {ModalController} from '@ionic/angular';
import {QrScanner} from '../../../../../services/qrscanner/qrscanner';
import {isEmpty} from 'lodash';

@Component({
  templateUrl: './send.page.html',
  styleUrls: ['./send.page.scss']
})
export class SendPage implements OnInit {

    wallet: WalletModelService;
    currentAddrId: string = '';
    recipientAddr: string;

    constructor(
        private activedRoute: ActivatedRoute,
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router,
        private modalCtrl: ModalController,
        private qrScanner: QrScanner
    ) {
    }

    ngOnInit() {
        let walletid = this.activedRoute.parent.snapshot.params.id;
        if (!walletid) {
            return this.showInvalidWalletToast();
        }

        let wallets = this.profileService.getWallet(walletid);
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

    async presentModal(type, recipient=null) {
        let modal, callback;

        switch (type) {
            case 'createAddress':
                modal = await this.modalCtrl.create({
                    component: CreateAddressPage,
                    componentProps: { parent: this, callback: 'createAddress', modal }
                });
                break;
            case 'updateAddress':
                modal = await this.modalCtrl.create({
                    component: CreateAddressPage,
                    componentProps: { parent: this, callback: 'updateAddress', modal, tag: recipient.tag, address: recipient.address}
                });
                break;
        }

        await modal.present();
    }

    updateAddress(address) {
        address.id = this.currentAddrId;
        this.wallet.updateRecipient(address);
        this.profileService.storageProfile();
    }

    createAddress(address) {
        this.wallet.addRecipient(address);
        this.profileService.storageProfile();
    }

    deleteAddress(recipient) {
        let opts = {
            backdropDismiss: false,
            header: 'Warning',
            message: '确定删除？',
            mode: 'ios',
            buttons: [
                {
                    text: 'NO',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        // nothing to do
                    }
                }, {
                    text: "YES",
                    handler: () => {
                        this.wallet.deleteRecipient(recipient);
                        this.profileService.storageProfile();
                    }
                }
            ]
        };

        this.popupService.ionicCustomAlert(opts);
    }

    sendByRecipient(recipientAddr) {
        if (isEmpty(recipientAddr)) {
            recipientAddr = this.recipientAddr;
        }

        this.router.navigate([`/home/transfer/${this.wallet.id}/enter_amount`], {queryParams: {recipient: recipientAddr}});
    }

    more(event, recipient) {
        if (recipient.id === this.currentAddrId) {
            this.currentAddrId = '';
        } else {
            this.currentAddrId = recipient.id;
        }

        event.stopImmediatePropagation();
    }

    async openScanner() {
        let result = await this.qrScanner.scan();

        console.log("openScanner --------------------------- ", result);
    }
}