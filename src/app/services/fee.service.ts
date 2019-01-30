import {Injectable} from '@angular/core';
import {PersistenceService} from './persistence/persistence';
import {ProfileService} from './profile.service';
import {QrScanner} from './qrscanner/qrscanner';
import {Platform} from '@ionic/angular';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {HttpClient} from '@angular/common/http';
import {Logger} from './logger/logger';
import {Coin} from '../models/wallet-model.service';


const coinsCfg = {
    btc: {
        url: 'https://api.blockcypher.com/v1/btc/test3',
        defaultFee: 1000,
        defaultFeeLevel: 'medium', // 默认费用等级类型
        unit: 'sat/byte',
        keys: {
            // 费用等级
            high: 'high_fee_per_kb',
            medium: 'medium_fee_per_kb',
            low: 'low_fee_per_kb'
        },
        lastUpdateTs: null,
        fees: null
    },
    eth: {
        // 这个API服务只有主网的，其他testnet还有歹去search
        url: 'https://api.blockcypher.com/v1/eth/main',
        defaultFee: 1000,
        keys: {
            medium: 'medium_fee_per_kb',
            high: 'high_fee_per_kb',
            low: 'low_fee_per_kb'
        },
        lastUpdateTs: null,
        fees: null
    }
};

@Injectable({
    providedIn: 'root'
})
export class FeeService{
    // TODO 后台自动每隔一段时间更新rate
    public rate: Map<Coin, any> = new Map<Coin, any>();
    private rateServiceUrl: string = 'http://localhost:3000/';

    constructor(
        private persistence: PersistenceService,
        private profileService: ProfileService,
        private qrScanner: QrScanner,
        private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private httpClient: HttpClient,
        private logger: Logger
    ) {}

    // TODO
    refreshRate() {
        return this.getBtcFeeLevel();
    }

    public getFeeUnit(coin: Coin) {
        switch (coin) {
            case Coin.BTC:
                return coinsCfg.btc.unit;
                break;
            default:
                throw new Error("un-support coin: " + coin);
        }
    }

    public getDefaultLevel(coin: Coin) {
        switch (coin) {
            case Coin.BTC:
                return {
                    level: coinsCfg.btc.defaultFeeLevel,
                    value: coinsCfg.btc.defaultFee
                };
                break;
            default:
                throw new Error("un-support coin: " + coin);
        }
    }

    /**
     *
     * @param wallet
     * @param opts
     *      tx: Pending to transfer tranction data
     */
    sumFee(wallet, opts: any = {}) {
        if (!opts.hasOwnProperty('tx')) {
            throw new Error('Invalid tx');
        }

        let coin: Coin = opts.hasOwnProperty('coin') ? opts.coin : wallet.currentCoin;
        switch (coin) {
            case Coin.BTC:
                this.sumBtcFee(wallet, opts);
                break;
            default:
                throw new Error(`un-support coin: [${coin}]`);
        }
    }

    sumBtcFee(wallet, opts: any = {}) {

    }

    getFeeLevel(coin: Coin): Promise<any> {
        switch (coin) {
            case Coin.BTC:
                return this.getBtcFeeLevel();

                break;
            default:
                throw new Error('un-support coin: [${coin}]');
        }
    }

    getBtcFeeLevel(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.rate.has(Coin.BTC)) {
                return resolve(this.rate.get(Coin.BTC));
            }

            this.httpClient.get(coinsCfg.btc.url)
                .subscribe(
                    res => {
                        let keys = Object.keys(coinsCfg.btc.keys);
                        let levels = {};
                        for (let i=0; i<keys.length; i++) {
                            let key = coinsCfg.btc.keys[keys[i]];
                            if (!res.hasOwnProperty(key)) {
                                this.logger.error(`Get btc miner fee level error response : ${JSON.stringify(res)}`);
                                return reject(res);
                            }

                            levels[keys[i]] = res[key];
                        };

                        this.rate.set(Coin.BTC, levels);
                        return resolve(levels);
                    },
                    error => {
                        this.logger.error(``, error);
                        reject(error);
                    }
                )
        })
    }


}
