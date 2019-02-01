import { Component, OnInit, Input } from '@angular/core';
import {CardItemInterface} from '../card-item-interface';
import {Router} from '@angular/router';
import {ProfileService} from '../../../../services/profile.service';

@Component({
  selector: 'app-home-wallet-list-card',
  templateUrl: './wallet-list.page.html',
  styleUrls: ['./wallet-list.page.scss']
})
export class WalletListPage implements OnInit, CardItemInterface {

    @Input() data: any;
    constructor(
        private router: Router,
        private profileService: ProfileService
    ) { }

    ngOnInit() {}

    goToWalletDetails(wallet) {
        this.router.navigate([`/home/wallet/${wallet.id}`]);
    }
}
