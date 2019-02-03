import {Component, NgZone, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {Location} from "@angular/common";

@Component({
  templateUrl: './check-env.page.html',
  styleUrls: ['./check-env.page.scss'],
})
export class MnemonicBkCheckEnvPage implements OnInit {

  public isToast: boolean = false;

  constructor(
      private router: Router,
      private ngZone: NgZone
  ) {
  }

  ngOnInit() {
  }

  goback() {
    this.ngZone.run(() => {
        this.router.navigate(['/index/mnemonic_backup/index']);
    })
  }

  toggleToast() {
    this.isToast = !this.isToast;
  }

  continue() {
      this.router.navigate(['/index/mnemonic_backup/confirm']);
  }

}
