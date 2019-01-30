import { Component, OnInit, Input } from '@angular/core';
import {CardItemInterface} from '../card-item-interface';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home-wallet-list-card',
  templateUrl: './wallet-list.page.html',
  styleUrls: ['./wallet-list.page.scss']
})
export class WalletListPage implements OnInit, CardItemInterface {

    @Input() data: any;
    constructor(
        private router: Router
    ) { }

    ngOnInit() {
    }

    goToWalletDetails(wallet) {
        this.router.navigate([`/home/wallet/${wallet.id}`]);
    }
}
