import {Component, NgZone, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';

@Component({
    selector: 'app-home-index',
    templateUrl: './index.page.html',
    styleUrls: ['./index.page.scss']
})
export class IndexPage implements OnInit {

    constructor(private ngZone: NgZone, private router: Router) {
    }

    ngOnInit() {
    }

    goback() {
        this.ngZone.run(() => {
            this.router.navigate(['/home']);
        });
    }
}