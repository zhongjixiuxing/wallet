import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import {ProfileService} from '../../../../../services/profile.service';
import {PopupService} from '../../../../../services/popup.service';
import {ModalController, IonContent, Platform} from '@ionic/angular';
import {Location} from '@angular/common';
import {parseInt} from 'lodash';
import {Logger} from '../../../../../services/logger/logger';

@Component({
  templateUrl: './logs.page.html',
  styleUrls: ['./logs.page.scss']
})
export class LogsPage implements OnInit {

    @ViewChild(IonContent) content: IonContent;

    levels: any = {
        debug: true,
        info: true,
        warn: true,
        error: true
    }

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
        private logger: Logger,
        private ngZone: NgZone
    ) {
    }

    ngOnInit() {
    }

    toggleLevel(level:string) {
        this.levels[level] = !this.levels[level];
    }

    goback() {
        this.ngZone.run(() => {
            this.router.navigate(['/home'])
        });
    }
}
