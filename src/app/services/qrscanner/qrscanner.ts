/* tslint:disable:no-console */
import { Injectable } from '@angular/core';
import {Logger} from '../logger/logger';
import {QRScanner, QRScannerStatus} from '@ionic-native/qr-scanner/ngx';
import {AppService} from '../app.service';
import {Platform} from '@ionic/angular';
import {PopupService} from '../popup.service';

@Injectable({
    providedIn: 'root'
})
export class QrScanner {
    private _appDom: HTMLElement;
    private _scannerDom: HTMLElement;
    private _isEnableLight: boolean = false;
    private _isDisplay: boolean = false;
    public isInit: boolean = false;
    public isApp: boolean = null;

    constructor(
      private logger: Logger,
      public qrScanner: QRScanner,
      private platform: Platform,
      private popupService: PopupService
    ){
    }

    public async init() {
        this._appDom = <HTMLElement>document.getElementsByTagName('ion-app')[0];
        this._scannerDom = <HTMLElement>document.getElementById('app-scanner');
    }

    public reverseDomDisplay() {
        if (!this._isDisplay) {
            this._appDom.style.display = 'none';
            this._scannerDom.style.display = 'block';
        } else {
            this._appDom.style.display = 'flex';
            this._scannerDom.style.display = 'none';
        }

        this._isDisplay = !this._isDisplay;
    }

    public prepare() {
        return new Promise((resolve, reject) => {
            this.qrScanner.prepare()
                .then(status => {
                    if (status.authorized) {
                        resolve(status);
                    } else {
                        this.logger.warn('Camera is not authorize, status: ', status);
                        reject(status);
                    }
                })
                .catch(err => {
                    this.logger.error('Prepare camera error: ', err);
                    reject(err);
                });
        })
    }

    public async scan() {
        if (!this.isMobile()) {
            this.showUnSupportScanError();
            return false;
        }

        this.reverseDomDisplay();

        if (!this.isInit) {
            await this.prepare();
            this.isInit = true;
        }

        await new Promise((resolve, reject) => {
            this.qrScanner.show()
                .then(
                    data => {
                        let scanSub = this.qrScanner.scan()
                            .subscribe(
                                (text: string) => {
                                    this.qrScanner.hide(); // hide camera preview
                                    scanSub.unsubscribe(); // stop scanning
                                    this.reverseDomDisplay(); // close scanner review

                                    resolve(text);
                                },
                                error => {
                                    this.logger.error('Camera scan error: ', error);
                                    reject(error);
                                }
                            );
                    }
                )
        })
    }

    public async hide() {
        if (this.isInit) {
            throw new Error('Camera is not init');
        }

        return await this.qrScanner.hide();
    }

    public async destroy() {
        if (!this.isInit) {
            throw new Error('Camera is not init');
        }

        this.isInit = false;
        await this.qrScanner.destroy();
        this.reverseDomDisplay();
    }

    public async reverseLight() {
        if (!this._isEnableLight){
            await this.enableLight();
        } else {
            await this.disableLight();
        }

        this._isEnableLight =  !this._isEnableLight;
    }

    public async checkLightStatus() {
        let status: QRScannerStatus = await this.qrScanner.getStatus();
        if (!status.canEnableLight) {
            throw new Error('Device can not enable light.');
        }
    }

    public async enableLight() {
        await this.checkLightStatus();
        await this.qrScanner.enableLight();
    }

    public async disableLight() {
        await this.checkLightStatus();
        await this.qrScanner.disableLight();
    }

    public async checkChangeCamera(): Promise<QRScannerStatus>{
        let status: QRScannerStatus = await this.qrScanner.getStatus();
        if (!status.canChangeCamera) {
            throw new Error('Device can not change camera.');
        }

        return status;
    }

    public async reverseCamera(){
        let status: QRScannerStatus = await this.checkChangeCamera();
        if (status.currentCamera === 0) {
            this.qrScanner.useFrontCamera();
        } else {
            this.qrScanner.useBackCamera();
        }
    }

    public isMobile(): boolean {
        // '"ios" | "ipad" | "iphone" | "android" | "phablet" | "tablet" | "cordova" | "capacitor" | "electron" | "pwa" | "mobile" | "desktop" | "hybrid"'
        if (this.isApp === null) {
            if(!this.platform.is('mobile')) {
                this.isApp = false;
            } else {
                this.isApp = true;
            }
        }

        return this.isApp;

    }

    public showUnSupportScanError() {
        let opts = {
            backdropDismiss: false,
            header: 'Error',
            message: 'Current Device un-support Camera',
            mode: 'ios',
            buttons: [
                {
                    text: 'OK',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        // nothing to do
                    }
                }
            ]
        };

        this.popupService.ionicCustomAlert(opts);
    }

}
