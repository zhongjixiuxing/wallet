import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WalletModelService} from '../../../../../models/wallet-model.service';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';
import {Logger} from '../../../../../services/logger/logger';
import {Subscription} from 'rxjs/Rx';

@Component({
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss']
})
export class ActivityPage implements OnInit, OnDestroy {

    profileEvent$$: Subscription;

    wallet: WalletModelService;

    txs: any = [];
    txShowFlag: boolean = true;

    constructor(
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router,
        private logger: Logger,
        private ngZone: NgZone,
        private activatedRoute: ActivatedRoute
    ) {
        this.profileEvent$$ = this.profileService.event$
            .subscribe(
                event => {

                    /**
                     *  refresh view txs
                     *
                     *  TODO 还有更好的方式吗？
                     */
                    switch (event.event) {
                        case 'TxsRefresh':
                        case 'NexTxs':
                        case 'UpdateTx':
                            this.txs = JSON.parse(JSON.stringify(this.wallet.coins.get(this.wallet.currentCoin).txs));
                            break;

                    }
                }
            );
    }

    ngOnDestroy() {
        if (this.profileEvent$$) {
            this.profileEvent$$.unsubscribe();
        }
    }

    ngOnInit() {
        let walletid = this.activatedRoute.parent.snapshot.params.id;
        if (!walletid) {
            return this.showInvalidWalletToast();
        }

        let wallets = this.profileService.getWallet(walletid);
        if (wallets.length !== 1) {
            return this.showInvalidWalletToast();
        }

        this.wallet = wallets[0];

        this.txs = this.wallet.coins.get(this.wallet.currentCoin).txs;
    }

    showInvalidWalletToast() {
        let opts = {
            message: "Invalid Wallet[ID]!",
            color: 'danger',
            position: 'bottom',
            duration: 3000
        };

        this.popupService.ionicCustomToast(opts);
        this.ngZone.run(() => {
            this.router.navigate(['/home']);
        });
    }

    gotoTx(tx) {
        this.ngZone.run(() => {
            let url =  `/home/wallet/${this.wallet.id}/tx/${this.wallet.currentCoin}/${tx.id}`;
            this.router.navigateByUrl(url);
        });
    }
}
