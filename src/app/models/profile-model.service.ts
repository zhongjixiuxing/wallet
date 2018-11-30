import { Injectable } from '@angular/core';
import {WalletModelService} from "./wallet-model.service";

// @Injectable({
//   providedIn: 'root'
// })
export class ProfileModelService {
    isInit: boolean = false;
    wallets: Array<WalletModelService> = [];
    email: String;

    constructor() {
    }
}
