import { Injectable } from '@angular/core';
import {ProfileModelService} from "../models/profile-model.service";
import {PersistenceService} from "./persistence/persistence";
import {Logger} from "./logger/logger";
import {WalletService} from './wallet.service';

import {remove} from 'lodash';
import {Coin, CoinCfg, WalletModelService} from '../models/wallet-model.service';
import {uniqBy} from 'lodash';
import {Subject} from 'rxjs/Rx';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  public event$: Subject<any> = new Subject<any>();
  protected profile: ProfileModelService;
  protected dirty: boolean = false;

  constructor(
      private persistence: PersistenceService,
      private logger: Logger,
      private walletService: WalletService
  ) {
    this.profile = new ProfileModelService();
  }

  public async loadForPersistence() {
    try {
        let profileData: any = await this.persistence.getProfile();
        if (!profileData) return;

        let tempWallets = [];

        profileData.wallets.forEach(walletData => {
            let wallet = new WalletModelService(walletData);

            // format coins to Map<Coin, CoinCfg>
            let coins = wallet.coins;
            let keys = Object.keys(coins);
            let temp: Map<Coin, CoinCfg> = new Map<Coin, CoinCfg>();
            for (let i=0; i<keys.length; i++) {
              temp.set(Coin[keys[i]], new CoinCfg(coins[keys[i]]));
            }
            wallet.coins = temp;

            tempWallets.push(wallet);
        })

        profileData.wallets = tempWallets;
        Object.assign(this.profile,  profileData);
    } catch (error) {
      this.logger.error('[ProfileService loadForPersistence failed]', error);
      throw error;
    }
  }

  public setIsInit(isInit: boolean) {
    this.profile.isInit = isInit;
    this.dirty = true;
  }

  public addWallet(wallet) {
    this.profile.wallets.push(wallet);
    this.profile.wallets = uniqBy(this.profile.wallets, (wallet) => wallet.id);
    this.walletService.addWallet(wallet);
    this.dirty = true;
  }

    /**
     *
     * @param walletId
     * @return {Array<WalletModelService>}
     */
  public getWallet(walletId): Array<WalletModelService> {
    return this.profile.wallets.filter((wallet) => {
      if (wallet.id === walletId) {
        return wallet;
      }
    })
  }

  public async deleteWallet(walletId) {
    let deleteWallet = remove(this.profile.wallets, wallet => {
      if (wallet.id === walletId) {
        return true;
      }
    });

    if (!deleteWallet) {
      throw new Error(`WalletId not found : ${walletId}`);
    }

    this.dirty = true;
    await this.storageProfile();
    return deleteWallet;
  }

  public getAllWallet() {
    return this.profile.wallets;
  }

  public setEmail(email) {
    this.profile.email = email;
    this.dirty = true;
  }

  public getProfile() {
    return this.profile;
  }

  public async storageProfile() {
    await this.persistence.setProfile(this.profile);
    this.dirty = false;

    return true;
  }
}
