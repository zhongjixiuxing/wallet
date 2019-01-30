import { Injectable }             from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
}                           from '@angular/router';
import {ProfileService} from '../../services/profile.service';
import {Platform} from '@ionic/angular';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {AppService} from '../../services/app.service';

@Injectable({
    providedIn: 'root',
})
export class CanShowRouteCheckService implements CanActivate, CanActivateChild  {
    constructor(
        private router: Router,
        private profileService: ProfileService,
        private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private appService: AppService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

        return new Promise(async (resolve, reject) => {
            await this.initializeApp();

            let url: string = state.url;

            let profile = this.profileService.getProfile();
            if (profile.isInit) {
                this.router.navigate(['/home']);
                return reject(false);
            }

            return resolve(true);
        });
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this.canActivate(route, state);
    }

    async initializeApp() {
        await this.platform.ready()
        await this.appService.init();

        this.statusBar.styleDefault();
        this.splashScreen.hide();
    }
}