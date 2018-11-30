import {ChangeDetectorRef, Component} from '@angular/core';
import {PersistenceService} from "../../services/persistence/persistence";
import {ErrorFormatService} from "../../services/error-format.service";
import {ProfileService} from '../../services/profile.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {
  constructor() {}
}
