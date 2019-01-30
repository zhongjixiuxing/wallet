import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UsbTransferPipe} from './usb-transfer.pipe';


@NgModule({
  imports: [],
  declarations: [
      UsbTransferPipe
  ],
    exports: [
        UsbTransferPipe
    ]
})
export class AppPipeModule {}