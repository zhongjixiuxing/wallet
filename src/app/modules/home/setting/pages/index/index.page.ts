import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';
import {ModalController, IonContent, Platform} from '@ionic/angular';
import {Location} from '@angular/common';
import {parseInt} from 'lodash';

@Component({
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss']
})
export class IndexPage implements OnInit {

    @ViewChild(IonContent) content: IonContent;

    modals: any = {}

    labelShow: boolean = false;

    labelOpts: any = {
        opacity: 1,
        fontSize: 25
    }

    constructor(
        private profileService: ProfileService,
        private popupService: PopupService,
        private router: Router,
        private activedRoute: ActivatedRoute,
        private modalCtrl: ModalController,
        private platform: Platform,
        private ngZone: NgZone
    ) {
    }

    ngOnInit() {
    }

    async alertHelperContact() {
        let opts = {
            backdropDismiss: false,
            header: 'Contact',
            message: '<span>Email: </span> anxing131@gmail.com <br>' +
            '<span>QQ: </span> 1965198272 <br>' +
            '<span>Github: </span> zhongjixiuxing <br>' +
            '<span>Tel: </span> ************',
            mode: 'ios',
            buttons: [{text: "Close"}]
        };

        this.popupService.ionicCustomAlert(opts);
    }

    goback() {
        this.jump('/home');
    }

    onScroll(event){
        let startY = event.detail.currentY;
        let topHeight = this.platform.height() * 0.13;
        let safeHeight = topHeight;

        if (startY > safeHeight) {
            this.labelShow = true;
        } else {
            this.labelShow = false;
        }

        let ratio = 1 - (startY / safeHeight);
        let fontSize: number = 25;
        let opacity = 1;

        if (ratio < 1 && ratio > 0) {
            fontSize = fontSize * ratio;
            opacity  = opacity * ratio;

            if (fontSize < 12) {
                fontSize = 12;
            }
        }

        this.labelOpts.fontSize = parseInt(`${fontSize}`);
        this.labelOpts.opacity = opacity;
    }

    jump(link: string): void {
        this.ngZone.run(() => {
            this.router.navigate([link]);
        });
    }

}
