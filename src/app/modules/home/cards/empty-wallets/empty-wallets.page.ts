import {Component, OnInit, Input, NgZone} from '@angular/core';
import {CardItemInterface} from '../card-item-interface';
import {ProfileService} from '../../../../services/profile.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home-empty-wallets-card',
  templateUrl: './empty-wallets.page.html',
  styleUrls: ['./empty-wallets.page.scss']
})
export class EmptyWalletsPage implements OnInit, CardItemInterface {

    @Input() data: any;
    constructor(private profileService: ProfileService, private ngZone: NgZone, private router: Router) {
    }

    ngOnInit() {
        let interval = setInterval(() => {
            if (this.profileService.profile.wallets.length > 0) {
                this.ngZone.run(() => {
                    this.router.navigate(['/home']);
                    clearInterval(interval);
                    location.reload();
                })
            }
        }, 50)
    }

    createNewWallet() {

    }
}
