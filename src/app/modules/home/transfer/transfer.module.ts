import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {TransferRouterModule} from './transfer.router.module';
import {TranslateModule} from '@ngx-translate/core';
import {IndexPage} from './pages/index/index.page';
import {ConfirmPage} from './pages/confirm/confirm.page';
import {ChangeFeeLevelPage} from './pages/confirm/change-fee-level/change-fee-level.page';
import {UsbTransferPipe} from '../../../pipes/usb-transfer.pipe';
import {AppPipeModule} from '../../../pipes/app-pipe.module';
import {SuccessPage} from './pages/confirm/success/success.page';
import {TransferPage} from './transfer.page';


@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    AppPipeModule,
    TransferRouterModule,
  ],
  declarations: [
      IndexPage,
      ConfirmPage,
      ChangeFeeLevelPage,
      SuccessPage,
      TransferPage
  ],
    entryComponents: [
        ChangeFeeLevelPage,
        SuccessPage
    ]
})
export class TransferModule {}