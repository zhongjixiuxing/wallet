import {Injectable} from '@angular/core';
import {PersistenceService} from './persistence/persistence';
import {ProfileService} from './profile.service';
import {QrScanner} from './qrscanner/qrscanner';
import {Router} from '@angular/router';
import {Platform} from '@ionic/angular';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {HttpClient} from '@angular/common/http';
import {Logger} from './logger/logger';

@Injectable({
    providedIn: 'root'
})
export class RateService{
    public lastRefreshTs: any;
    public rate: Array<any>;
    private rateServiceUrl: string = 'https://api.nomics.com/v1/prices?key=2018-09-demo-dont-deploy-b69315e440beb145';

    constructor(
        private persistence: PersistenceService,
        private profileService: ProfileService,
        private qrScanner: QrScanner,
        private router: Router,
        private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private httpClient: HttpClient,
        private logger: Logger
    ) {
    }

    getRateByNomics(symbolPair: string) {
        symbolPair = symbolPair.toUpperCase();

        return new Promise((resolve, reject) => {
            let now: any = new Date();
            now = now.valueOf();

            // 15分钟刷新一次
            if (this.lastRefreshTs && (now - this.lastRefreshTs) <= 900000 && this.rate.length > 0) {
                let rate = this.rate.find(item => {
                    return item.currency === symbolPair;
                });

                if (!rate) {
                    return reject('SymbolPairNotFound');
                }

                return resolve(rate);
            }

            this.refreshRate()
                .then(
                    (res: any) => {
                        if (res.length < 0) {
                            this.logger.error('Invalid rate response: ' + JSON.stringify(res));
                            return reject('ServerError');
                        }

                        this.lastRefreshTs = new Date().valueOf();
                        this.rate = res;

                        let rate = this.rate.find(item => {
                            return item.currency === symbolPair;
                        });

                        if (!rate) {
                            return reject('SymbolPairNotFound');
                        }

                        return resolve(rate);
                    }
                )

                .catch(err => reject(err))
        })
    }

    // https://api.huobi.pro/market/tickers
    // 这个需要翻墙
    getRate(symbolPair: string) {
        return new Promise((resolve, reject) => {
            if (this.rate) {
                let rate = this.rate.find(item => {
                    return item.symbol === symbolPair;
                });

                if (!rate) {
                    return reject('SymbolPairNotFound');
                }

                return resolve(rate);
            }

            this.refreshRate()
                .then(
                    (res: any) => {
                        if (!res.hasOwnProperty('status') || res.status !== 'ok'
                            || !res.hasOwnProperty('data') || !Array.isArray(res.data)
                        ) {
                            this.logger.error('Invalid rate response: ' + JSON.stringify(res));
                            return reject('ServerError');
                        }

                        this.rate = res.data;

                        let rate = this.rate.find(item => {
                            return item.symbol === symbolPair;
                        });

                        if (!rate) {
                            return reject('SymbolPairNotFound');
                        }

                        return resolve(rate);
                    }
                )
                .catch(
                    err => {
                        reject(err);
                    }
                )
        })
    }

    refreshRate() {
        return new Promise((resolve, reject) => {
            if (this.rate) {
                return resolve(this.rate);
            }

            this.httpClient.get(this.rateServiceUrl)
                .subscribe(
                    res => {
                        resolve(res);
                    },
                    err => {
                        this.logger.error('refresh rate error: ', err);
                        reject(err);
                    }
                )
        })
    }
}
