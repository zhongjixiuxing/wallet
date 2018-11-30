import { Type } from '@angular/core';

export class CardItem {
    constructor(public component: Type<any>, public data: any) {}
}