import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexPage} from './pages/index/index.page';
import {InitialDataGuardService} from '../../../services/initial-data-guard.service';
import {ConfirmPage} from './pages/confirm/confirm.page';

const routes: Routes = [
  {
      canActivate: [InitialDataGuardService],
      path: ':id',
      children: [
          {
              path: 'enter_amount',
              component: IndexPage
          },
          {
              path: 'confirm',
              component: ConfirmPage
          }
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransferRouterModule {}
