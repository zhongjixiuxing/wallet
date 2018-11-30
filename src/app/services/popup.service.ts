import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {AlertController, ToastController, LoadingController} from '@ionic/angular';
import { Logger } from './logger/logger';

@Injectable({
    providedIn: 'root'
})
export class PopupService {
    constructor(
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController,
        private logger: Logger,
        private translate: TranslateService
    ) {}

    public async ionicAlert(
        header: string,
        subHeader?: string,
        message:string = '',
        okText?: string
    ): Promise<any> {
        return new Promise(resolve => {
            this.alertCtrl.create({
                header,
                subHeader,
                message,
                backdropDismiss: false,
                buttons: [
                    {
                        text: okText ? okText : this.translate.instant('Ok'),
                        handler: () => {
                            this.logger.info('Ok clicked');
                            resolve();
                        }
                    }
                ]
            })
            .then(alert => {
                alert.present();
            })
        });
    }

    public ionicConfirm(
        header: string,
        message: string,
        okText?: string,
        cancelText?: string
    ): Promise<any> {
        return new Promise(resolve => {
            this.alertCtrl.create({
                header,
                message,
                buttons: [
                    {
                        text: cancelText ? cancelText : this.translate.instant('Cancel'),
                        handler: () => {
                            this.logger.info('Disagree clicked');
                            resolve(false);
                        }
                    },
                    {
                        text: okText ? okText : this.translate.instant('Ok'),
                        handler: () => {
                            this.logger.info('Agree clicked');
                            resolve(true);
                        }
                    }
                ],
                backdropDismiss: false
            })
            .then(alert => {
                alert.present();
            })
        });
    }

    public ionicPrompt(
        header: string,
        message: string,
        opts?,
        okText?: string,
        cancelText?: string
    ): Promise<any> {
        return new Promise(resolve => {
            let cssClass = opts && opts.useDanger ? 'alertDanger' : null;
            let backdropDismiss = !!(opts && opts.backdropDismiss);
            let inputs = opts && opts.inputs ? opts.inputs : [];

            this.alertCtrl.create({
                header,
                message,
                cssClass,
                backdropDismiss,
                inputs,
                buttons: [
                    {
                        text: cancelText ? cancelText : this.translate.instant('Cancel'),
                        handler: () => {
                            this.logger.info('Cancel clicked');
                            resolve(null);
                        }
                    },
                    {
                        text: okText ? okText : this.translate.instant('Ok'),
                        handler: data => {
                            this.logger.info('Saved clicked');
                            resolve(data);
                        }
                    }
                ]
            })
            .then(prompt => {
                prompt.present();
            })
        });
    }


    /**
     *
     * @param options
     * @return {Promise<HTMLIonToastElement>}
     */
    public async ionicCustomToast(options) {
        const toast = await this.toastCtrl.create(options);
        toast.present();

        return toast;
    }

    /**
     *
     * @param options
     * @return {Promise<HTMLIonAlertElement>}
     */
    public async ionicCustomAlert(options) {
        let alert = await this.alertCtrl.create(options);
        await alert.present();

        return alert;
    }

    /**
     *
     * @param options
     * @return {Promise<HTMLIonLoadingElement>}
     */
    public async ionicCustomLoading(options) {
        const loading = await this.loadingCtrl.create();
        await loading.present();
        return loading;
    }

    public showIonicCustomErrorAlert(error) {
        return new Promise(async (resolve) => {
            let header = this.translate.instant('app.errors.service');
            let btnText = this.translate.instant('app.ok');
            let opts = {
                backdropDismiss: false,
                header,
                message: error.message,
                mode: 'ios',
                cssClass: 'app-error-alert',
                buttons: [
                    {
                        text: btnText,
                        role: 'confirm',
                        cssClass: 'secondary',
                        handler: () => {
                            resolve();
                        }
                    }
                ]
            };

            this.ionicCustomAlert(opts);
        })
    }
}