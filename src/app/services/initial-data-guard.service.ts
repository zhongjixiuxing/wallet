import {Injectable} from '@angular/core';
import {ProfileService} from './profile.service';
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot} from '@angular/router';
import {AppService} from './app.service';

@Injectable({
    providedIn: 'root'
})
export class InitialDataGuardService implements CanActivate, CanActivateChild {

    constructor(private appService: AppService, private profileService: ProfileService, private router: Router) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (this.appService.isInit) {
                return resolve(true);
            }

            await this.appService.initializeApp();

            let url: string = state.url;
            this.appService.isInit = true;
            let profile = this.profileService.getProfile();
            if (profile.isInit) {
                if (url.startsWith('/index')) {
                    this.router.navigate(['/home']);
                    return reject(false);
                }

                this.router.navigateByUrl(url);
                return reject(false);
            }

            return resolve(true);
        })
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<boolean> {
        return this.canActivate(route, state);
    }
}
