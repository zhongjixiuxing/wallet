import {Injectable} from '@angular/core';

const config: any = {
    api: {
        btcGateway: {
            prefix: "http://192.168.199.229:5000/v1",
            apis: {
                wallet:"/wallet",
                wallet_next_path: '/wallet/coin/next_path',
                update_scan_flag: '/wallet/coin/update_scan_flag'
            }
        },
        btcRpc: 'http://192.168.199.229:5001'
    }
};

@Injectable({
    providedIn: 'root'
})
export class ConfigService{
    public globalCfg: any  = config;

    constructor() {}
}