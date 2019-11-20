import {Component, Input, OnInit} from '@angular/core';
import {PopupService} from '../../../../../../services/popup.service';
import {WalletModelService} from '../../../../../../models/wallet-model.service';
import {isEmpty} from 'lodash';
import {Logger} from '../../../../../../services/logger/logger';

@Component({
  templateUrl: './custom-address-modal.page.html',
  styleUrls: ['./custom-address-modal.page.scss']
})
export class CustomAddressModalPage implements OnInit {

    @Input()
    data: any;

    @Input()
    parent: any;

    path: string;
    constructor(
        private popupService: PopupService,
        private logger: Logger,
    ) {}

    ngOnInit() {
    }

    close() {
        if (isEmpty(this.path)) {
            return this.parent.customPathModal.dismiss();
        }

        let checkRes = this.checkPath(this.path)
        if (checkRes !== true) {
            return this.showErrorToast(`${checkRes}`, 2000);
        }

        this.parent.customPathModal.dismiss({path: this.path});
    }

    checkPath(path: string) {
        return WalletModelService.validatePath(path, this.parent.wallet.coin);
    }

    showErrorToast(message: string = null, duration: number = 200) {
        this.logger.warn(`Invalid path format: ${message}`);
        let opts = {
            message: `Invalid path format! [${message}]`,
            subtitle: 'message',
            color: 'danger',
            position: 'bottom',
            duration,
        }

        this.popupService.ionicCustomToast(opts);
    }
}
