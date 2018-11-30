import { Injectable } from '@angular/core';
import * as Bip39 from 'bip39'
import {ProfileModelService} from "../models/profile-model.service";
import {PersistenceService} from "./persistence/persistence";
import {Logger} from "./logger/logger";
import {WalletService} from './wallet.service';

import {remove} from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
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
        let profileData = await this.persistence.getProfile();
        if (!profileData) return;

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
    this.walletService.addWallet(wallet);
    this.dirty = true;
  }

  public getWallet(walletId) {
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
      throw new Error('WalletId not found : '+walletId);
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
