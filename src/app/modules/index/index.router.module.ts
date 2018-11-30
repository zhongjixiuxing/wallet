import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {IndexPage} from './index/index.page';
import {IndexSlidesPage} from "./slides/slides.page";
import {AgreementPage} from "./agreement/agreement.page";
import {EmailSettingPage} from "./email-setting/email-setting.page";
import {MnemonicBkIndexPage} from "./mnemonic-backup/index/index.page";
import {MnemonicBkCheckEnvPage} from "./mnemonic-backup/check-env/check-env.page";
import {MnemonicBkConfirmPage} from "./mnemonic-backup/confirm/confirm.page";
import {CanShowRouteCheckService} from './can-show-route-check.service';

const routes: Routes = [
  {
      canActivate: [CanShowRouteCheckService],
      path: 'index',
      // component: IndexPage,
      children: [
          {
              path: '',
              component: IndexPage
          },
          {
              path: 'slides',
              // outlet: 'slides',
              component: IndexSlidesPage
          },
          {
              path: 'index',
              component: IndexPage
          },
          {
              path: 'agreement',
              component: AgreementPage
          },
          {
              path: 'email_setting',
              component: EmailSettingPage
          },
          {
              path: 'mnemonic_backup/index',
              component: MnemonicBkIndexPage
          },
          {
              path: 'mnemonic_backup/check_env',
              component: MnemonicBkCheckEnvPage
          },
          {
              path: 'mnemonic_backup/confirm',
              component: MnemonicBkConfirmPage
          },
          {
              path: 'agreement',
              component: AgreementPage
          },
      ]
  },
  {
      path: '',
      redirectTo: '/index',
      pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndexPageRoutingModule {}
