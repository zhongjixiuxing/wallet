import {Component, Input, NgZone, OnInit} from '@angular/core';
import {PopupService} from '../../../../../../../services/popup.service';
import {TranslateService} from '@ngx-translate/core';
import {ProfileService} from '../../../../../../../services/profile.service';
import {Logger} from '../../../../../../../services/logger/logger';
import {Router} from '@angular/router';
import {isEmpty} from 'lodash';

@Component({
  templateUrl: './create-address.page.html',
  styleUrls: ['./create-address.page.scss']
})
export class CreateAddressPage implements OnInit {

    @Input()
    parent

    @Input()
    callback

    @Input()
    modal

    @Input()
    address: string

    @Input()
    tag: string

    constructor(
        private zone: NgZone,
        private popupService: PopupService,
        private translate: TranslateService,
        private profileService: ProfileService,
        private logger: Logger,
        private router: Router

    ) {}

    ngOnInit() {
    }

    back() {
        this.zone.run(async () => {
            await this.modal.dismiss()
        })
    }

    create() {
        if (isEmpty(this.address)) {
            return this.alertError('address can not be empty')
        }

        this.parent[this.callback]({address: this.address, tag: this.tag});
        this.back();
    }

   alertError(text: string) {
       let opts = {
           backdropDismiss: false,
           header: 'Error',
           message: text,
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
