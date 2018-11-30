import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexPage} from './pages/index/index.page';
import {ActivityPage} from './pages/activity/activity.page';
import {ReceivePage} from './pages/receive/receive.page';
import {SendPage} from './pages/send/send.page';
import {OptionsPage} from './pages/options/options.page';


const routes: Routes = [
  {
      path: ':id',
      component: IndexPage,
      // pathMatch: 'full'
      children: [
          {
              path: '',
              component: IndexPage
          },
          {
              path: 'activity',
              outlet: 'activity',
              component: ActivityPage
          },
          {
              path: 'receive',
              outlet: 'receive',
              component: ReceivePage
          },
          {
              path: 'send',
              outlet: 'send',
              component: SendPage
          },
      ]
  },
  {
      path: ':id/options',
      component: OptionsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndexPageRoutingModule {}
