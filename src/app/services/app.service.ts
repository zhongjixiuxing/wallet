import {Injectable} from '@angular/core';
import {PersistenceService} from './persistence/persistence';
import {ProfileService} from './profile.service';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor(
        private persistence: PersistenceService,
        private profileService: ProfileService
    ) {
    }

    /**
     * 负责初始化应用各种服务数据
     *
     * @return {Promise<void>}
     */
    public async init() {
        this.persistence.load();
        await this.profileService.loadForPersistence();
    }
}
