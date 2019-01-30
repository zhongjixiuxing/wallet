import {Component, NgZone, OnInit} from '@angular/core';
import {Location} from '@angular/common';

@Component({
    selector: 'app-home-index',
    templateUrl: './index.page.html',
    styleUrls: ['./index.page.scss']
})
export class IndexPage implements OnInit {

    constructor(private location: Location, private ngZone: NgZone) {
    }

    ngOnInit() {
    }

    goback() {
        this.ngZone.run(() => {
            this.location.back();
        });
    }
}