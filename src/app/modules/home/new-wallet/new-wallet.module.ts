import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IndexPageRoutingModule} from './index.router.module';
import {TranslateModule} from '@ngx-translate/core';
import {IndexPage} from './pages/index/index.page';
import {CreatePage} from './pages/create/create.page';


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
      CreatePage
  ],
})
export class NewWalletModule {}
