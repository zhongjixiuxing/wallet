import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { IndexPageRoutingModule } from './index.router.module';

import { MainPage } from './main.page';
import { HomePageModule } from '../home/home.module';
import {IndexSlidesPage} from "./slides/slides.page";
import {AgreementPage} from "./agreement/agreement.page";
import {EmailSettingPage} from "./email-setting/email-setting.page";
import {MnemonicBkIndexPage} from "./mnemonic-backup/index/index.page";
import {MnemonicBkCheckEnvPage} from "./mnemonic-backup/check-env/check-env.page";
import {MnemonicBkConfirmPage} from "./mnemonic-backup/confirm/confirm.page";
import {IndexPage} from './index/index.page';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        IndexPageRoutingModule,
        HomePageModule,
        TranslateModule,
        ReactiveFormsModule
    ],
    declarations: [
        MainPage,
        IndexSlidesPage,
        AgreementPage,
        EmailSettingPage,
        MnemonicBkIndexPage,
        MnemonicBkCheckEnvPage,
        MnemonicBkConfirmPage,
        IndexPage
    ]
})
export class IndexPageModule {}
