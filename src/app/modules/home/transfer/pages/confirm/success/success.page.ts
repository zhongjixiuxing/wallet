import {Component, Input, NgZone, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
    templateUrl: './success.page.html',
    styleUrls: ['./success.page.scss']
})
export class SuccessPage implements OnInit {

    @Input()
    public id: string;

    @Input()
    public modal: any;

    constructor(
        private router: Router,
        private ngZone: NgZone
    ) {}

    ngOnInit() {}

    go(){
        this.ngZone.run(() => {
            this.modal.dismiss();
            this.router.navigate(['/home/wallet/'+this.id]);
        })
    }

}
