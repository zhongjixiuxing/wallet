import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {ProfileService} from '../../../services/profile.service';

@Component({
  selector: 'app-index',
  templateUrl: 'index.page.html',
  styleUrls: ['index.page.scss']
})
export class IndexPage {
    canShow: boolean = false;

    constructor(private router: Router, private profileService: ProfileService){
        let wallets = this.profileService.getAllWallet();

        if (wallets.length > 0) {
            setTimeout(() => {
                this.router.navigate(['/home']);
            }, 0)
        } else {
            this.canShow = true;
        }


    }

    gotoGetStart(){
      this.router.navigate(['/index/agreement'])
    }
}
