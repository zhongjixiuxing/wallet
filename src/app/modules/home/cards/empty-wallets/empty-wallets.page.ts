import { Component, OnInit, Input } from '@angular/core';
import {CardItemInterface} from '../card-item-interface';

@Component({
  selector: 'app-home-empty-wallets-card',
  templateUrl: './empty-wallets.page.html',
  styleUrls: ['./empty-wallets.page.scss']
})
export class EmptyWalletsPage implements OnInit, CardItemInterface {

    @Input() data: any;
    constructor() { }

    ngOnInit() {
    }

    createNewWallet() {

    }
}
