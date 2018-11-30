import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {PopupService} from "./popup.service";

@Injectable({
    providedIn: 'root'
})
export class ErrorFormatService {
    constructor(
        private translate: TranslateService,
        private popupService: PopupService
    ) {}

    public showErrorAlert(err) {
        this.popupService
            .ionicAlert(
                'Service Error',
                this.msg(err)
            )
            .then(() => {
                // nothing to do
            });
    }

    public msg(err, prefix?: string): string {
        if (!err) return 'Unknown error';

        const name = err.name
            ? err.name === 'Error'
                ? err.message
                : err.name.replace(/^anxing.Error/g, '')
            : err;

        let body = '';
        prefix = prefix || '';

        if (name) {
            switch (name) {
                case 'INVALID_BACKUP':
                    body = this.translate.instant('Wallet Recovery Phrase is invalid');
                    break;
                case 'WALLET_DOES_NOT_EXIST':
                    body = this.translate.instant(
                        'Wallet not registered at the wallet service. Recreate it from "Create Wallet" using "Advanced Options" to set your recovery phrase'
                    );
                    break;
                case 'MISSING_PRIVATE_KEY':
                    body = this.translate.instant('Missing private keys to sign');
                    break;
                case 'SERVER_COMPROMISED':
                    body = this.translate.instant(
                        'Server response could not be verified'
                    );
                    break;
                case 'COULD_NOT_BUILD_TRANSACTION':
                    body = this.translate.instant('Could not build transaction');
                    break;
                case 'INSUFFICIENT_FUNDS':
                    body = this.translate.instant('Insufficient funds');
                    break;
                case 'CONNECTION_ERROR':
                    body = this.translate.instant('Network error');
                    break;
                case 'NOT_FOUND':
                    body = this.translate.instant('Wallet service not found');
                    break;
                case 'ECONNRESET_ERROR':
                    body = this.translate.instant('Connection reset by peer');
                    break;
                case 'WALLET_ALREADY_EXISTS':
                    body = this.translate.instant('Wallet already exists');
                    break;
                case 'COPAYER_IN_WALLET':
                    body = this.translate.instant('Copayer already in this wallet');
                    break;
                case 'WALLET_NOT_FOUND':
                    body = this.translate.instant('Wallet not found');
                    break;
                case 'NOT_AUTHORIZED':
                    body = this.translate.instant('Not authorized');
                    break;
                case 'WALLET_LOCKED':
                    body = this.translate.instant('Wallet is locked');
                    break;
                case 'WALLET_NOT_COMPLETE':
                    body = this.translate.instant('Wallet is not complete');
                    break;
                case 'WALLET_NEEDS_BACKUP':
                    body = this.translate.instant('Wallet needs backup');
                    break;
                case 'WRONG_PASSWORD':
                    body = this.translate.instant('Wrong password');
                    break;
                case 'EXCEEDED_DAILY_LIMIT':
                    body = this.translate.instant(
                        'Exceeded daily limit of $500 per user'
                    );
                    break;
                case 'ERROR':
                    body = err.message || err.error;
                    break;

                default:
                    body = err.message || name;
                    break;
            }
        } else if (err.message) {
            body = err.message;
        } else {
            body = err;
        }

        var msg = prefix + (body ? (prefix ? ': ' : '') + body : '');
        return msg;
    }

    public cb(err: string, prefix?: string): Promise<any> {
        return new Promise(resolve => {
            resolve(this.msg(err, prefix));
        });
    }
}