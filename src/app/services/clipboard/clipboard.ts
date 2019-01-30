/* tslint:disable:no-console */
import { Injectable } from '@angular/core';
import {Logger} from '../logger/logger';
import {Clipboard as NgxClipboard} from '@ionic-native/clipboard/ngx';

@Injectable({
    providedIn: 'root'
})
export class Clipboard {
    constructor(
        private logger: Logger,
        private clipboard: NgxClipboard
    ){}

    copy(text: string) {
        return this.clipboard.copy(text);
    }

    clear() {
        return this.clipboard.clear();
    }

    paste(): Promise<any> {
        return this.clipboard.paste();
    }

}
