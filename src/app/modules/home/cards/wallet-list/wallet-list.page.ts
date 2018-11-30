import { Component, OnInit, Input } from '@angular/core';
import {CardItemInterface} from '../card-item-interface';

@Component({
  selector: 'app-home-wallet-list-card',
  templateUrl: './wallet-list.page.html',
  styleUrls: ['./wallet-list.page.scss']
})
export class WalletListPage implements OnInit, CardItemInterface {

    @Input() data: any;
    constructor() { }

    ngOnInit() {
    }
}
