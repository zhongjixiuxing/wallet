import {Injectable} from '@angular/core';
import {PersistenceService} from './persistence/persistence';
import {ProfileService} from './profile.service';
import {QrScanner} from './qrscanner/qrscanner';
import {Router} from '@angular/router';
import {Platform} from '@ionic/angular';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {WorkerMessage} from '../../web-worker/app-workers/shared/worker-message.model';
import {WORKER_TOPIC} from '../../web-worker/app-workers/shared/worker-topic.constants';
import {WebWorkerService} from './web-worker.service';
import {Logger} from './logger/logger';
import {Coin, WalletModelService} from '../models/wallet-model.service';
import {WalletService} from './wallet.service';
import {ConfigService} from './config.service';
import {isEmpty, findIndex, concat} from 'lodash';
import {createDeflateRaw} from 'zlib';

@Injectable({
    providedIn: 'root'
})
export class AppService{
    public isInit: boolean = false;

    constructor(
        private persistence: PersistenceService,
        private profileService: ProfileService,
        private walletService: WalletService,
        private qrScanner: QrScanner,
        private router: Router,
        private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private webWorker: WebWorkerService,
        private logger: Logger,
        private config: ConfigService
    ) {
        this.initWebWorkerCB();
    }

    /**
     * 负责初始化应用各种服务数据
     *
     * @return {Promise<void>}
     */
    public async init() {
        await this.persistence.load();
        await this.profileService.loadForPersistence();
        await this.loadLogsForPersistence();
        await this.qrScanner.init();
    }

    public async loadLogsForPersistence() {
        try {
            let logs = await this.persistence.getLogs();
            this.logger.logs = concat(this.logger.logs, logs);
            this.logger.logs = this.logger.logs.slice(0, 10000);
        } catch (err) {
            this.logger.error(`[Logger.loadLogsForPersistence] error: `, err);
        }
    }

    async initializeApp() {
        await this.platform.ready()
        await this.init();

        this.monitor();

        this.statusBar.styleDefault();
        this.splashScreen.hide();
    }

    /***
     * 负责监控blockchain 活动
     *
     * @return {Promise<void>}
     */
    async monitor() {
        setInterval(() => {
            this.refreshTxs();
        }, 60000);
    }

    /***
     * 调用web-worker 异步后台refreshTxs
     */
    refreshTxs() {
        let wallets = this.profileService.getAllWallet();
        let workerMessage = new WorkerMessage(WORKER_TOPIC.refreshTxs, {
            jobId: new Date().valueOf(),
            wallets: wallets,
            btcRpcUrl: this.config.globalCfg.api.btcRpc
        });
        this.webWorker.doWork(workerMessage);
    }

    async refreshTxsCB(msg: any) {
        let data = msg.data;
        if (data.status !== null || !data.hasOwnProperty('walletId') || !data.hasOwnProperty('coin') || isEmpty(data.updateTxs)) {
            return this.logger.error(`[refreshTxsCB] Invalid worker response: `, data);
        }

        let wallet: any = this.profileService.getWallet(data.walletId);
        if (wallet.length === 0) { // maybe wallet deleted
            return;
        }

        wallet = wallet[0];
        let coinCfg = wallet.coins.get(data.coin);

        let txsId = Object.keys(data.updateTxs);

        for (let i=0; i<txsId.length; i++) {
            let updateTx = data.updateTxs[txsId[i]];
            let tIndex = findIndex(coinCfg.txs, (tx: any) => {
                return txsId[i] === tx.id
            });
            if (tIndex === -1) { // new tx
                coinCfg.txs.push(updateTx);
                coinCfg.txs = coinCfg.txs.slice(-10000, coinCfg.txs.length); // 保留一万条tx
                continue;
            }

            let updateFields = Object.keys(updateTx);
            for (let t=0; t<updateFields.length; t++) {
                coinCfg.txs[tIndex][updateFields[t]] = updateTx[updateFields[t]];
            }
        }

        this.profileService.event$.next({
            event: 'TxsRefresh',
            data: coinCfg.txs
        });
        await this.profileService.storageProfile();
    }

    /***
     * 处理web-worker 的回调信息
     *
     */
    private initWebWorkerCB() {
        this.webWorker.workerUpdate$
            .subscribe(
                async (msg: WorkerMessage) => {
                    switch (msg.topic) {
                        case WORKER_TOPIC.firstInitBtcWallet:
                            this.firstInitBtcWallet(msg);
                            break;

                        case WORKER_TOPIC.refreshTxs:
                            this.refreshTxsCB(msg);
                            break;

                        case WORKER_TOPIC.Error:
                            this.logger.error('[AppService.initWebWorkerCB] error: ', msg.data)
                            break;
                        default:
                            break;
                    }
                },
                err => {
                    this.logger.error('[AppService.initWebWorkerCB] error: ', err);
                }
            )
    }

    async firstInitBtcWallet(msg) {
        if (!msg.data.hasOwnProperty('status') || msg.data.status !== null
            || !msg.data.hasOwnProperty('jobId') || !msg.data.hasOwnProperty('data')
        ) {
            this.logger.error('[WebWorker] [firstInitBtcWallet] Invalid response format: ', msg.data);
            return;
        }

        let walletId = msg.data.jobId;
        let resp = msg.data.data;
        let wallet: any = this.profileService.getWallet(walletId);
        if (wallet.length <= 0) {
            this.logger.error('[WebWorker] [firstInitBtcWallet] wallet is not exists when cb: ', JSON.stringify({
                walletId,
                resp
            }));
            return;
        }

        wallet = wallet[0];
        if (wallet.currentCoin === Coin.BTC) {
            wallet.currentPath = resp.lastPath;
            wallet.currentReceiveAddress = resp.address;
        }

        let coinCfg = wallet.coins.get(Coin.BTC);
        if (!coinCfg) {
            this.logger.error('[initWebWorkerCB] CoinCfg not exists', {coin: Coin.BTC});
        }

        coinCfg.currentPath = resp.lastPath;
        coinCfg.currentReceiveAddress = resp.address;
        coinCfg.isFirstFullScan = true;

        let txsArr = resp.txsArr;
        coinCfg.txs = txsArr;
        this.profileService.event$.next({
            event: 'TxsRefresh',
            data: txsArr
        });

        wallet.amount = resp.balance;
        await this.profileService.storageProfile();

        let hasUpdated: boolean  = false;
        let res = await this.walletService.updateScanFlag(wallet, Coin.BTC, resp.lastPath, {app: {
                DuplicateRequest: () => { // 忽略默认的重复弹框处理
                    hasUpdated = true;
                    return true;
                }
            }});

        if (res.body.err !== null) {
            if (hasUpdated) {
                this.logger.warn('[initWebWorkerCB] expect scan flag is false, but real is true');
            } else {
                this.logger.error('[initWebWorkerCB] [updateScanFlag] error: ', {
                    res: res.body,
                    walletId: wallet.id,
                    coin: Coin.BTC,
                    path: resp.lastPath
                });
            }
        }

        // this.walletService.syncTxs(wallet);
    }
}
