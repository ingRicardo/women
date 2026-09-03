import { Component } from '@angular/core';
//import { Login } from '../login/login';
import { Womanmain } from '../womanmain/womanmain';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Womanmain/*, Login */],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {

}
