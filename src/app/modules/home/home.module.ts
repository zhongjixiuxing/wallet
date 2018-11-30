import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import {IndexPage} from './index/index.page';
import {IndexPageRoutingModule} from './index.router.module';
import {CardDirective} from './cards/card-directive';
import {WalletListPage} from './cards/wallet-list/wallet-list.page';
import {EmptyWalletsPage} from './cards/empty-wallets/empty-wallets.page';
import {TranslateModule} from '@ngx-translate/core';
import {NewWalletPage} from './new-wallet/new-wallet.page';
import {WalletDetailPage} from './wallet-detail/wallet-detail.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    IndexPageRoutingModule,

  ],
  declarations: [
      HomePage,
      IndexPage,
      CardDirective,
      WalletListPage,
      EmptyWalletsPage,
      NewWalletPage
  ],
    entryComponents: [WalletListPage, EmptyWalletsPage]
})
export class HomePageModule {}
