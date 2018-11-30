import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';

@Component({
  templateUrl: './receive.page.html',
  styleUrls: ['./receive.page.scss']
})
export class ReceivePage implements OnInit {

    wallet: WalletModelService;

    constructor(
        private activedRoute: ActivatedRoute,
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router
    ) {
    }

    ngOnInit() {
        let params = this.activedRoute.snapshot.params;
        // let wallets = this.profileService.getWallet(params.id);
        //
        // if (wallets.length !== 1) {
        //     let opts = {
        //         message: "Invalid Wallet[ID]!",
        //         color: 'danger',
        //         position: 'bottom',
        //         duration: 3000
        //     }
        //
        //     this.popupService.ionicCustomToast(opts);
        //     return this.router.navigate(['/home']);
        // }
        //
        // this.wallet = wallets[0];
    }
}
