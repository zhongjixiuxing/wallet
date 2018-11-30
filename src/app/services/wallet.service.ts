import { Injectable } from '@angular/core';
import * as Bip39 from 'bip39'
import {WalletModelService} from "../models/wallet-model.service";

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private wallets: WalletModelService[] = [];
  constructor() {}

  createWallet() {
    let mnemonic = this.generateMnemonic();

    return new WalletModelService({mnemonic})
  }

  createWalletFromMnemonic () {}

  generateMnemonic() {
    return Bip39.generateMnemonic()
  }

  addWallet(wallet) {
    this.wallets[wallet.id] = wallet;
  }

  decrypt(wallet, password) {}

  encrypt(wallet, password) {}

  import(opts) {}

  export(wallet) {}
}
