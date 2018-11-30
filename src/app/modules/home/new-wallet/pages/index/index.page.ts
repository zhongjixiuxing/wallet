import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';

@Component({
  selector: 'app-home-index',
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss']
})
export class IndexPage implements OnInit {

  constructor(private location: Location) { }

  ngOnInit() {
  }

    goback() {
        this.location.back();
    }
}
