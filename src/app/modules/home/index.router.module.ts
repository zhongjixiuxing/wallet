import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CanShowRouteCheckService} from './can-show-route-check.service';
import {IndexPage} from './index/index.page';
import {NewWalletPage} from './new-wallet/new-wallet.page';

const routes: Routes = [
  {
      canActivate: [CanShowRouteCheckService],
      path: 'index',
      children: [
          {
              path: '',
              component: IndexPage
          }
      ]
  },
  {
      path: 'new_wallet',
      component: NewWalletPage,
      loadChildren: './new-wallet/new-wallet.module#NewWalletModule'
  },
  {
      path: 'wallet',
      loadChildren: './wallet-detail/wallet-detail.module#WalletDetailModule'
  },
  {
      path: '',
      redirectTo: 'index',
      pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndexPageRoutingModule {}
