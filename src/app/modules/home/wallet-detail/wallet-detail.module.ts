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
import {DeleteWarningPage} from './pages/options/modals/delete-warning/delete-warning.page';
import { QRCodeModule } from 'angularx-qrcode';
import {CustomAddressModalPage} from './pages/receive/custom-address-modal/custom-address-modal.page';
import {CopiedPopPage} from './pages/receive/copied-pop/copied-pop.page';
import {CreateAddressPage} from './pages/options/modals/create-address/create-address.page';
import {UsbTransferPipe} from '../../../pipes/usb-transfer.pipe';
import {WalletTxsPipe} from '../../../pipes/wallet-txs.pipe';
import {GroupTxsPipe} from '../../../pipes/group-txs.pipe';
import {AppPipeModule} from '../../../pipes/app-pipe.module';
import {TxDetailPage} from './pages/tx-detail/tx-detail.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    IndexPageRoutingModule,
      AppPipeModule,
      QRCodeModule
  ],
  declarations: [
      // UsbTransferPipe,
      WalletTxsPipe,
      GroupTxsPipe,
      IndexPage,
      WalletDetailPage,
      ActivityPage,
      ReceivePage,
      SendPage,
      OptionsPage,
      DeleteWarningPage,
      CreateAddressPage,
      CustomAddressModalPage,
      CopiedPopPage,
      TxDetailPage
  ],
  entryComponents: [
      DeleteWarningPage,
      CreateAddressPage,
      CustomAddressModalPage,
      CopiedPopPage
  ]
})
export class WalletDetailModule {
}
