import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';

@Component({
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss']
})
export class IndexPage implements OnInit {

    wallet: WalletModelService;

    constructor(
        private activedRoute: ActivatedRoute,
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router,
        private activedRouter: ActivatedRoute
    ) {
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


    async ngOnInit() {
        let walletid = this.activedRouter.snapshot.params.id;
        if (!walletid) {
            return this.showInvalidWalletToast();
        }

        let wallets = this.profileService.getWallet(walletid);
        if (wallets.length !== 1) {
            return this.showInvalidWalletToast();
        }

        this.wallet = wallets[0];
    }

    async ngOnInit_bk() {
        let walletid, splits = null;

        let reg = this.router.url.match(/wallet\/.*\/detail\/\(/i);
        if (!reg) {
            reg = this.router.url.match(/wallet\/.*/i);
            splits = reg[0].split('/');
            if (splits.length !== 2) {
                return this.showInvalidWalletToast();
            }
        } else {
            splits = reg[0].split('/');
            if (splits.length !== 4) {
                return this.showInvalidWalletToast();
            }
        }

        walletid = splits[1];
        // default redirect to activity tab
        let outlets = ['activity', 'receive', 'send'];

        if (outlets.indexOf(this.activedRouter.outlet) === -1
            && this.router.url.endsWith(walletid)
        ) {
            let url = `/home/wallet/${walletid}/detail/(activity:activity)`;
            this.router.navigateByUrl(url);
        }

        let wallets = this.profileService.getWallet(walletid);

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

    doRefresh(event) {
        setTimeout(() => {
            event.target.complete();
        }, 2000);
    }

    segmentChanged(value){
    }

    goOptions() {
        this.router.navigateByUrl(`/home/wallet/${this.wallet.id}/options`);
    }
}
