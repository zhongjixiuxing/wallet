import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexPage} from './index/index.page';
import {NewWalletPage} from './new-wallet/new-wallet.page';
import {InitialDataGuardService} from '../../services/initial-data-guard.service';

const routes: Routes = [
  {
      canActivate: [InitialDataGuardService],
      path: 'index',
      children: [
          {
              path: '',
              component: IndexPage
          }
      ]
  }, {
      canActivate: [InitialDataGuardService],
      path: 'new_wallet',
      component: NewWalletPage,
      loadChildren: './new-wallet/new-wallet.module#NewWalletModule'
  }, {
      path: 'wallet',
      loadChildren: './wallet-detail/wallet-detail.module#WalletDetailModule'
  }, {
      path: 'setting',
      loadChildren: './setting/setting.module#SettingModule'
  }, {
      path: 'transfer',
      loadChildren: './transfer/transfer.module#TransferModule'
  }, {
      canActivate: [InitialDataGuardService],
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
