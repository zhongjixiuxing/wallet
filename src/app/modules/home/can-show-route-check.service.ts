import { Injectable }             from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
}                           from '@angular/router';
import {ProfileService} from '../../services/profile.service';



@Injectable({
    providedIn: 'root',
})
export class CanShowRouteCheckService implements CanActivate, CanActivateChild  {
    constructor(
        private router: Router,
        private profileService: ProfileService
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean
    {
        let url: string = state.url;
        let profile = this.profileService.getProfile();
        if (!profile.isInit) {
            this.router.navigate(['/index']);
            return false;
        }

        return true;
    }

    canActivateChild(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }
}