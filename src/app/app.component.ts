import { Component, NgZone } from '@angular/core';

import {TranslateService} from "@ngx-translate/core";
import {Router} from '@angular/router';
import {QrScanner} from './services/qrscanner/qrscanner';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private translate: TranslateService,
    private router: Router,
    private qrScanner: QrScanner
  ) {
      translate.setDefaultLang('en');
  }

  closeQrScanner() {
    console.log('close ----------------------------------- ');
    this.qrScanner.destroy();
  }

    async reverseLight() {
      await this.qrScanner.reverseLight();
    }

    async reverseScanner() {
      await this.qrScanner.reverseCamera();
    }

}
