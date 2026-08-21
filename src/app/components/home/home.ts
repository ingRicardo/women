import { Component } from '@angular/core';
import { Login } from '../login/login';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Login],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {

}
