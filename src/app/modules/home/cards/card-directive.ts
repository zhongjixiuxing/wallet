import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[app-home-card-directive]',
})
export class CardDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

