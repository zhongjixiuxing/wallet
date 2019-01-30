import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {IndexPage} from './pages/index/index.page';
import {LogsPage} from './pages/logs/logs.page';

const routes: Routes = [
  {
      path: '',
      children: [
          {
              path: '',
              component: IndexPage
          },
          {
              path: 'logs',
              component: LogsPage
          }
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndexPageRoutingModule {}
