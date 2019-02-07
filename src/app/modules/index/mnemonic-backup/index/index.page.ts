import {Component, NgZone, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {PersistenceService} from '../../../../services/persistence/persistence';
import {WalletModelService} from '../../../../models/wallet-model.service';

@Component({
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss'],
})
export class MnemonicBkIndexPage implements OnInit {
  private newWallet: WalletModelService;

  constructor(private router: Router,private ngZone: NgZone, private persistence: PersistenceService) { }

  async ngOnInit() {
      let newWallet = await this.persistence.getTempporaryData('newWallet');
      this.newWallet = newWallet;
  }


  backup() {
    this.router.navigate(['/index/mnemonic_backup/check_env'])
  }

  async jump() {
      await this.persistence.setTemporaryData('newWallet', this.newWallet);
      this.router.navigate(['/index/agreement']);
  }
}
