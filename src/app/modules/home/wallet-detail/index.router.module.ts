import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexPage} from './pages/index/index.page';
import {ActivityPage} from './pages/activity/activity.page';
import {ReceivePage} from './pages/receive/receive.page';
import {SendPage} from './pages/send/send.page';
import {OptionsPage} from './pages/options/options.page';
import {AppService} from '../../../services/app.service';
import {InitialDataGuardService} from '../../../services/initial-data-guard.service';
import {TxDetailPage} from './pages/tx-detail/tx-detail.page';


const routes: Routes = [
  {
      canActivate: [InitialDataGuardService],
      // canActivateChild: [InitialDataGuardService],
      path: ':id/detail',
      component: IndexPage,
      children: [
          {
              path: 'activity',
              // outlet: 'activity',
              component: ActivityPage
          },
          {
              path: 'receive',
              // outlet: 'receive',
              component: ReceivePage
          },
          {
              path: 'send',
              // outlet: 'send',
              component: SendPage
          },
      ]
  },
    {
        canActivate: [InitialDataGuardService],
        path: ':id/options',
        component: OptionsPage
    },
    {
        canActivate: [InitialDataGuardService],
        path: ':id/tx/:coin/:txid',
        component: TxDetailPage
    },

    {
        path: ':id',
        redirectTo: '/home/wallet/:id/detail/activity'
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndexPageRoutingModule {}
