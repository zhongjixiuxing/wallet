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
import {Subject} from 'rxjs/Rx';

@Injectable({
    providedIn: 'root'
})
export class AppService{
    public isInit: boolean = false;
    public isScanning: boolean = false;
    public isMonitorFullScan: boolean = false;
    public event$: Subject<any> = new Subject<any>();

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
        this.fullScan();
        this.refreshTxs();
        this.refreshAmount();

        setInterval(() => {
            this.fullScan();
            this.refreshTxs();
            this.refreshAmount();
        }, 60000);

        this.monitorFullScan();
        /***
         *  每十分钟执行检测
         */
        setInterval(() => {
            this.monitorFullScan();
        }, 600000);
    }


    async monitorFullScan() {
        try {
            if (this.isMonitorFullScan) {
                return;
            }
            this.isMonitorFullScan = true;

            let tempData = await this.persistence.getTemp();
            tempData = tempData || {};

            if (!tempData.hasOwnProperty('fullScan')) {
                tempData.fullScan = [];
            }

            const now = Date.now();
            for (let i = 0; i < tempData.fullScan.length; i++) {
                const scanCfg = tempData.fullScan[i];
                if (scanCfg.lastCheckTs && (now - scanCfg.lastCheckTs) <= 3600000 ) {
                    continue;
                }

                const workerMessage = new WorkerMessage(WORKER_TOPIC.checkFullScanResult, {
                    jobId: new Date().valueOf(),
                    url: `${this.config.globalCfg.api.btcRpc}/wallet/${scanCfg.walletId}`,
                    cfg: scanCfg
                });

                this.webWorker.doWork(workerMessage);

                scanCfg.lastCheckTs = Date.now();
                await this.storageScanCfgSync(scanCfg); // 同步到物理存储
            }
        } catch (e) {
            this.logger.error(`[monitorFullScan] error: `, e);
        } finally {
            this.isMonitorFullScan = false;
        }
    }

    async storageScanCfgSync(cfg) {
        let tempData = await this.persistence.getTemp();
        tempData = tempData || {};

        if (!tempData.hasOwnProperty('fullScan')) {
            tempData.fullScan = [];
        }

        for (let i = 0; i < tempData.fullScan.length; i++) {
            const scanCfg = tempData.fullScan[i];
            if (scanCfg.walletId === cfg.id && scanCfg.coin === cfg.coin) {
                tempData[i] = scanCfg;
                await this.persistence.setTemp(tempData);
                break;
            }
        }
    }

    async removeScanCfg(cfg) {
        let tempData = await this.persistence.getTemp();
        tempData = tempData || {};

        if (!tempData.hasOwnProperty('fullScan')) {
            tempData.fullScan = [];
        }

        for (let i = 0; i < tempData.fullScan.length; i++) {
            const scanCfg = tempData.fullScan[i];
            if (scanCfg.walletId === cfg.walletId && scanCfg.coin === cfg.coin) {
                tempData.fullScan.splice(i, 1);
                await this.persistence.setTemp(tempData);

                // refresh local wallet state
                const wallets = this.profileService.getWallet(scanCfg.walletId);
                const wallet = wallets[0];

                const coinCfg = wallet.coins.get(Coin.BTC);
                if (!coinCfg) {
                    return this.logger.error('[removeScanCfg] CoinCfg not exists', {coin: Coin.BTC});
                }
                coinCfg.isFirstFullScan = true;
                await this.profileService.storageProfile();

                break;
            }
        }
    }

    async refreshAmount() {
        // 超过十分钟，执行刷新操作
        const wallets = this.profileService.getAllWallet();
        wallets.forEach(wallet => {
            const workerMessage = new WorkerMessage(WORKER_TOPIC.refreshAmount, {
                jobId: new Date().valueOf(),
                url: `${this.config.globalCfg.api.btcRpc}/wallet/${wallet.id}`,
                walletId: wallet.id
            });

            this.webWorker.doWork(workerMessage);
        });
    }

    async refreshAmountCB(msg: any) {
        const data = msg.data;
        if (data.status !== null) {
            return this.logger.error(`[refreshAmountCB] Invalid worker response: `, data);
        }

        const amount = data.data.amount;
        const wallets = this.profileService.getWallet(data.data.reqData.walletId);
        if (wallets.length !== 1) {
            return;
        }

        const wallet = wallets[0];
        wallet.amount = amount;
    }

    async fullScan() {
        try {
            if (this.isScanning) {
                return;
            }

            this.isScanning = true;

            const wallets = this.profileService.getAllWallet();
            let tempData = await this.persistence.getTemp();
            tempData = tempData || {};

            if (!tempData.hasOwnProperty('fullScan')) {
                tempData.fullScan = [];
            }

            // 先扫描钱包
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                wallet.coins.forEach((coinCfg, coin) => {
                    if (coinCfg.isFirstFullScan) {
                        return;
                    }

                    let exist = false;
                    for (let k = 0; k < tempData.fullScan.length; k++) {
                        const scanCfg = tempData.fullScan[k];
                        if (scanCfg.walletId === wallet.id && scanCfg.coin === coin  ) {
                            exist = true;
                            break;
                        }
                    }

                    if (!exist) {
                        tempData.fullScan.push({
                            walletId: wallet.id,
                            mnemonic: wallet.mnemonic,
                            coin,
                            startIndex: 0,
                            endIndex: 1000,
                            ts: 0,
                            lastCheckTs: Date.now()
                        });
                    }
                });
            }

            await this.persistence.setTemp(tempData);
            const now = Date.now();
            for (let i = 0; i < tempData.fullScan.length; i++) {
                const scanCfg = tempData.fullScan[i];
                const diffTs = now - scanCfg.ts;
                if (diffTs <= 3600000) {
                    continue;
                }

                // 超过十分钟，执行刷新操作
                const workerMessage = new WorkerMessage(WORKER_TOPIC.fullScan, {
                    jobId: new Date().valueOf(),
                    url: `${this.config.globalCfg.api.btcRpc}/wallet/${scanCfg.walletId}`,
                    cfg: scanCfg
                });

                this.webWorker.doWork(workerMessage);
            }
        } catch (e) {
            this.logger.error(`[fullScan] error: `, e);
        } finally {
            this.isScanning = false;
        }
    }

    async fullScanCB(msg: any) {
        const data = msg.data;
        if (data.status !== null) {
            return this.logger.error(`[fullScanCB] Invalid worker response: `, data);
        }

        const scanCfg = data.data.reqData.cfg;

        const tempData = await this.persistence.getTemp();
        if (!tempData || !tempData.hasOwnProperty('fullScan')) {
            return;
        }

        for (let i = 0; i < tempData.fullScan.length; i++) {
            const t = tempData.fullScan[i];
            if (t.walletId === scanCfg.walletId && t.coin === scanCfg.coin) {
                tempData.fullScan[i].ts = Date.now();
                await this.persistence.setTemp(tempData);
                break;
            }
        }
    }

    async checkFullScanResultCB(msg: any) {
        const data = msg.data;
        if (data.status !== null) {
            return this.logger.error(`[checkFullScanResultCB] Invalid worker response: `, data);
        }

        const scanCfg = data.result.reqData.cfg;

        const tempData = await this.persistence.getTemp();
        if (!tempData || !tempData.hasOwnProperty('fullScan')) {
            return;
        }

        for (let i = 0; i < tempData.fullScan.length; i++) {
            const t = tempData.fullScan[i];
            if (t.walletId === scanCfg.walletId && t.coin === scanCfg.coin) {
                if (data.result.state === 'finished') {
                    let hasUpdated  = false;
                    const wallets = this.profileService.getWallet(scanCfg.walletId);
                    const wallet = wallets[0];
                    const res = await this.walletService.updateScanFlag(wallet, Coin.BTC, data.result.lastPath, {app: {
                            DuplicateRequest: () => { // 忽略默认的重复弹框处理
                                hasUpdated = true;
                                return true;
                            }
                        }});

                    if (res.body.err !== null && res.body.err !== 'DuplicateRequest') {
                        if (hasUpdated) {
                            this.logger.warn('[checkFullScanResultCB] expect scan flag is false, but real is true');
                        } else {
                            this.logger.error('[checkFullScanResultCB] [updateScanFlag] error: ', {
                                res: res.body,
                                walletId: wallet.id,
                                coin: Coin.BTC,
                            });
                        }

                        return;
                    }

                    await this.removeScanCfg(t); // 删除temp scan config
                    break;
                }

                t.lastIdx = data.result.lastIdx;
                t.startIndex += 1000;
                t.endIndex += 1000;
                t.lastCheckTs = Date.now();
                await this.storageScanCfgSync(t);

                const workerMessage = new WorkerMessage(WORKER_TOPIC.checkFullScanResult, {
                    jobId: new Date().valueOf(),
                    url: `${this.config.globalCfg.api.btcRpc}/wallet/${t.walletId}`,
                    cfg: t
                });

                this.webWorker.doWork(workerMessage);

                break;
            }
        }
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
                return txsId[i] === tx.id;
            });
            if (tIndex === -1) { // new tx
                coinCfg.txs.push({...updateTx, id: txsId[i]});
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
        // this.webWorker.workerUpdate$
        this.webWorker.workerSubject
            .subscribe(
                async (msg: WorkerMessage) => {
                    switch (msg.topic) {
                        case WORKER_TOPIC.firstInitBtcWallet:
                            // this.firstInitBtcWallet(msg);
                            this.event$.next({
                                event: 'FirstInitBtcWallet',
                                data: msg
                            });
                            break;

                        case WORKER_TOPIC.refreshTxs:
                            this.refreshTxsCB(msg);
                            break;

                        case WORKER_TOPIC.fullScan:
                            this.fullScanCB(msg);
                            break;

                        case WORKER_TOPIC.checkFullScanResult:
                            this.checkFullScanResultCB(msg);
                            break;

                        case WORKER_TOPIC.refreshAmount:
                            this.refreshAmountCB(msg);
                            break;

                        case WORKER_TOPIC.Error:
                            this.logger.error('[AppService.initWebWorkerCB] error: ', msg.data);
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
        return; // nothing to do
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
        // coinCfg.isFirstFullScan = true;

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
