import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss'],
})
export class MnemonicBkIndexPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }


  backup() {
    this.router.navigate(['/index/mnemonic_backup/check_env'])
  }
}
