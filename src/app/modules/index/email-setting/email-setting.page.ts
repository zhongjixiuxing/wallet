import {Component, OnInit, ViewChild} from '@angular/core';
import {Button} from "@ionic/angular";
import {Form, FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {Router} from "@angular/router";
import {ProfileService} from '../../../services/profile.service';

@Component({
  selector: 'app-email-setting',
  templateUrl: './email-setting.page.html',
  styleUrls: ['./email-setting.page.scss'],
})
export class EmailSettingPage implements OnInit {

    @ViewChild('continueBtn') continueBtn: Button;

    credentialsForm: FormGroup;

    email: String = '';

    continueEnableFlag: boolean = false;

    confirmDisplay: String = 'none';
    containerDisplay: String = 'flex';

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private profile: ProfileService
    ) {
        this.credentialsForm = this.formBuilder.group({
          email: new FormControl(this.email, []),
        });
    }

    ngOnInit() {
    }

    emailInputChange() {
        if (this.credentialsForm.status === 'VALID') {
            this.continueEnableFlag = true;
        } else {
            this.continueEnableFlag = false;
        }
    }

    continue() {
        let temp = this.confirmDisplay;
        this.confirmDisplay = this.containerDisplay;
        this.containerDisplay = temp;
    }

    confirm() {
        // TODO save subscribe email to remote server

        this.profile.setEmail(this.credentialsForm.value.email);
        this.router.navigate(['/index/mnemonic_backup/index'])
    }
}
