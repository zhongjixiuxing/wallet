import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IndexPageRoutingModule} from './index.router.module';
import {TranslateModule} from '@ngx-translate/core';
import {IndexPage} from './pages/index/index.page';
import {LogsPage} from './pages/logs/logs.page';


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
      LogsPage
  ],
  entryComponents: [
      LogsPage
  ],
  providers: [
  ],
})
export class SettingModule {}
