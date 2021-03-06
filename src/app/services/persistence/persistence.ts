import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { Events } from '@ionic/angular';
import * as _ from 'lodash';
import { Logger } from '../logger/logger';

import { PlatformService } from '../platform/platform';
import { FileStorage } from './storage/file-storage';
import { LocalStorage } from './storage/local-storage';
import { RamStorage } from './storage/ram-storage';
import {letProto} from 'rxjs-compat/operator/let';


export interface FeedbackValues {
  time: number;
  version: string;
  sent: boolean;
}

const Keys = {
    TEMPORARY_DATA: key => `tempData-${key}`,
    WALLETS: 'wallets',
    PROFILE: 'profile',
    LOGS: 'logs',
    TEMP: 'temp'
};

interface Storage {
  get(k: string): Promise<any>;
  set(k: string, v): Promise<void>;
  remove(k: string): Promise<void>;
  create(k: string, v): Promise<void>;
}

@Injectable({
    providedIn: 'root'
})
export class PersistenceService {
    public storage: Storage;
    public ramStorage: RamStorage;
    private persistentLogs;
    private logsBuffer: Array<{
        timestamp: string;
        level: string;
        msg: string;
    }>;
    private logsLoaded: boolean;
    private persistentLogsEnabled: boolean;

    constructor(private logger: Logger,
                private platform: PlatformService,
                private file: File,
                private events: Events) {

        // this._subscribeEvents();
        this.logger.debug('PersistenceService initialized');
        this.persistentLogs = {};
        this.logsBuffer = [];
        this.logsLoaded = false;
        this.persistentLogsEnabled = false;
    }

    public async load() {
        this.ramStorage = new RamStorage();
        this.storage = this.platform.isCordova
            ? new FileStorage(this.file, this.logger)
            : new LocalStorage(this.logger);

        let logs = await this.getLogs();
        this.logger.logs = this.logger.logs.concat(logs);
        // storage logs
        this.logger.event$
            .subscribe(
                event => {
                    let logs = this.logger.logs.slice(0, 10000); // 只保留1w条
                    this.setLogs(logs);
                }
            )
    }

    public setTemporaryData(key: String, data: any) {
        return this.ramStorage.set(Keys.TEMPORARY_DATA(key), data);
    }

    public getTempporaryData(key) {
        return this.ramStorage.get(Keys.TEMPORARY_DATA(key));
    }

    public async removeTemporaryData(key) {
        return await this.ramStorage.remove(Keys.TEMPORARY_DATA(key));
    }

    public setWallets() {}


    /**
     *
     * @param profile
     * @return {Promise<void>}
     */
    public async setProfile(profile) {
        let storageData = _.isString(profile) ?  profile : this.formatProfile(profile);

        return await this.storage.set(Keys.PROFILE, storageData);
    }

    /**
     *
     * @param data
     * @return {Promise<void>}
     */
    public async setTemp(data) {
        const storageData = _.isString(data) ?  data : JSON.stringify(data);

        return await this.storage.set(Keys.TEMP, storageData);
    }

    /**
     * @return {Promise<any>}
     */
    public async getTemp() {
        try {
            return await this.storage.get(Keys.TEMP);
        } catch (err) {
            this.logger.error('[PersistenceService.getTemp] error: ', err);
        }

    }

    formatProfile(profile) {
        /*
            to fix Wallet.coin Map toString issue

         */
        let temp = JSON.parse(JSON.stringify(profile));
        let wallets = [];
        for (let i=0; i<profile.wallets.length; i++) {
            let wallet = profile.wallets[i];
            let walletInfo = JSON.parse(JSON.stringify(wallet));

            wallet.coins.forEach((coinCfg, coin) => {
                walletInfo.coins[coin] = coinCfg;
                wallets.push(walletInfo)
            });
        }

        temp.wallets = wallets;
        return JSON.stringify(temp);
    }


    /**
     * @return {Promise<any>}
     */
    public async getProfile() {
        try {
            return await this.storage.get(Keys.PROFILE);
        } catch (err) {
            this.logger.error('[PersistenceService.getProfile] error: ', err);
        }

    }

    public async setLogs(logs) {
        let storageData = _.isString(logs) ?  logs : JSON.stringify(logs);

        return await this.storage.set(Keys.LOGS, storageData);
    }

    public async getLogs() {
        try {
            return await this.storage.get(Keys.LOGS);
        } catch (err) {
            this.logger.error('[PersistenceService.getLogs] error: ', err);
        }

    }
}




