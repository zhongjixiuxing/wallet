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
        // default redirect to activity tab
        let outlets = ['activity', 'receive', 'send'];
        if (outlets.indexOf(this.activedRouter.outlet) === -1
            && this.router.url.endsWith(this.activedRouter.snapshot.params.id)
        ) {
            let url = '/home/wallet/' + this.activedRouter.snapshot.params.id + '/(activity:activity)';
            this.router.navigateByUrl(url);
        }
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

    doRefresh(event) {
        console.log('refresh event : ', event);

        setTimeout(() => {
            console.log('Async operation has ended');
            event.target.complete();
        }, 2000);
    }

    segmentChanged(value){
        console.log('Segment changed', value);
    }

    goOptions() {
        this.router.navigateByUrl(`/home/wallet/${this.wallet.id}/options`);
    }
}
