import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver } from '@angular/core';
import {CardItem} from '../cards/card-item';
import {CardDirective} from '../cards/card-directive';
import {WalletListPage} from '../cards/wallet-list/wallet-list.page';
import {ProfileService} from '../../../services/profile.service';
import {EmptyWalletsPage} from '../cards/empty-wallets/empty-wallets.page';

@Component({
  selector: 'app-home-index',
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss']
})
export class IndexPage implements OnInit {

    @Input() cards: CardItem[] = [];

    @ViewChild(CardDirective) adHost: CardDirective;

  constructor(
      private componentFactoryResolver: ComponentFactoryResolver,
      private profileService: ProfileService
  ) { }

  ngOnInit() {
      this.loadComponent();
  }

  loadComponent() {
      let wallets = this.profileService.getAllWallet();

      let viewContainerRef = this.adHost.viewContainerRef;
      viewContainerRef.clear();

      if (wallets && wallets.length > 0 ) {
          let item = new CardItem(WalletListPage, {wallets});
          this.cards.push(item);

          let componentFactory = this.componentFactoryResolver.resolveComponentFactory(item.component);

          let componentRef = viewContainerRef.createComponent(componentFactory);
          (<CardItem>componentRef.instance).data = {wallets};
      } else {
          let item = new CardItem(EmptyWalletsPage, {});
          this.cards.push(item);

          let componentFactory = this.componentFactoryResolver.resolveComponentFactory(item.component);
          viewContainerRef.createComponent(componentFactory);
      }

  }

}
