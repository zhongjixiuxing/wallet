import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CoinCfg, WalletModelService} from '../../../../../models/wallet-model.service';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';
import {Clipboard} from '../../../../../services/clipboard/clipboard';
import {ActionSheetController, ModalController} from '@ionic/angular';
import {CustomAddressModalPage} from './custom-address-modal/custom-address-modal.page';
import {HttpClientService} from '../../../../../services/http-client.service';
import {WalletService} from '../../../../../services/wallet.service';
import {Logger} from '../../../../../services/logger/logger';

@Component({
  templateUrl: './receive.page.html',
  styleUrls: ['./receive.page.scss']
})
export class ReceivePage implements OnInit {

    wallet: WalletModelService;
    customPathModal: any;

    constructor(
        private activedRoute: ActivatedRoute,
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router,
        private clipboard: Clipboard,
        public actionSheetController: ActionSheetController,
        public modalController: ModalController,
        public walletService: WalletService,
        public logger: Logger
        // public popoverController: PopoverController
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

    async copyAddress(event: Event) {
        this.clipboard.copy(this.wallet.currentReceiveAddress);


        // ionic pop 这种方式暂没调试到怎样精准定位，放弃
        // let opts = {
        //     component: CopiedPopPage,
        //     event,
        //     translucent: true
        // };
        //
        // const popover = await this.popoverController.create(opts);
        // return await popover.present();

        let opts = {
            message: "address copied",
            color: 'primary',
            position: 'bottom',
            duration: 200,
            // translucent: true
        }

        this.popupService.ionicCustomToast(opts);
    }

    async openAddressActionSheet() {
        const actionSheet = await this.actionSheetController.create({
            header: 'Update Receive Address',
            buttons: [{
                text: 'Next',
                icon: 'arrow-dropright',
                handler: () => {
                    this.updateAddressByNext();
                }
            }, {
                text: 'Custom',
                icon: 'code-working',
                handler: () => {
                    this.updateAddressByCustom();
                }
            }]
        });
        await actionSheet.present();
    }

    async updateAddressByNext() {
        const res = await this.walletService.getWalletNextPath(this.wallet);

        if (!res || (res.body.err !== HttpClientService.Errors.OK)) {
            let opts = {
                message: "Internal Server Error",
                color: 'danger',
                position: 'bottom',
                duration: 3000
            };

            this.popupService.ionicCustomToast(opts);
            this.logger.error('Receive page get wallet next path error: ', res);
            return false;
        }

        const path = res.body.data.path;
        await this.updateAddress(path);
    }

    async updateAddressByCustom() {
        let opts = {
            component: CustomAddressModalPage,
            componentProps:{data: 123, parent: this }
        };

        this.customPathModal = await this.modalController.create(opts);
        this.customPathModal.onDidDismiss()
            .then(data => {
                if (!data.data){
                    return ;
                }

                let path: string = data.data.path;
                // this.wallet.createAddress(path, this.wallet.currentCoin, {updateCurrentPath: true, updateCurrentAddress: true});
                this.updateAddress(path);
            })
        await this.customPathModal.present();
    }

    async updateAddress(path: string) {
        const address = this.wallet.createAddress(path, this.wallet.currentCoin);

        const importAddrRes = await this.walletService.importBtcAddressToRemote(this.wallet, address);
        if (!importAddrRes.hasOwnProperty('body') || !importAddrRes.body || !importAddrRes.body.hasOwnProperty('error')
            || !importAddrRes.body.error === null
        ) {
            let opts = {
                message: "Internal Server Error",
                color: 'danger',
                position: 'bottom',
                duration: 3000
            };

            this.popupService.ionicCustomToast(opts);
            this.logger.error('Receive page [importBtcAddressToRemote] error : ', importAddrRes);
            return false;
        }

        this.wallet.createAddress(path, this.wallet.currentCoin, {updateCurrentPath: true, updateCurrentAddress: true});
        await this.profileService.storageProfile();

        return true;
    }
}
