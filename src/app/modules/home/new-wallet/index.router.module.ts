import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexPage} from './pages/index/index.page';
import {CreatePage} from './pages/create/create.page';
import {ImportFromMnemonicPage} from './pages/import-from-mnemonic/import-from-mnemonic.page';


const routes: Routes = [
  {
      path: 'index',
      children: [
          {
              path: '',
              component: IndexPage
          },
      ]
  },
  {
      path: 'create',
      component: CreatePage
  },
  {
      path: 'mnemonic',
      component: ImportFromMnemonicPage
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
