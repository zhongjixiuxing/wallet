import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IndexPageRoutingModule} from './index.router.module';
import {TranslateModule} from '@ngx-translate/core';
import {IndexPage} from './pages/index/index.page';
import {WalletDetailPage} from './wallet-detail.page';
import {ActivityPage} from './pages/activity/activity.page';
import {ReceivePage} from './pages/receive/receive.page';
import {SendPage} from './pages/send/send.page';
import {OptionsPage} from './pages/options/options.page';
import {DeleteWarningPage} from './pages/options/modals/delete-warning.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    IndexPageRoutingModule,
  ],
  declarations: [
      IndexPage,
      WalletDetailPage,
      ActivityPage,
      ReceivePage,
      SendPage,
      OptionsPage,
      DeleteWarningPage
  ],
  entryComponents: [
      DeleteWarningPage
  ]
})
export class WalletDetailModule {}
