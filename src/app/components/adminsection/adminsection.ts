import { Component, inject, signal } from '@angular/core';
import { Users } from '../users/users';
import { ActivatedRoute, Router } from '@angular/router';
import { WomenTabs } from "../../componets/women-tabs/women-tabs";
import { Womenregister } from '../womenregister/womenregister';
@Component({
  selector: 'app-adminsection',
  imports: [Users, WomenTabs, Womenregister],
  templateUrl: './adminsection.html',
  styleUrl: './adminsection.css',
})
export class Adminsection {
  username: string | null = null;
  password: string | null = null;
  role: string | null = null;
  private user = inject(ActivatedRoute);
  private passwordParam = inject(ActivatedRoute);
  private router = inject(Router);


  receivedWomen = signal<any[]>([]);
  
  
  ngOnInit() {
 
    this.username = this.user.snapshot.queryParamMap.get('user');
    this.password = this.passwordParam.snapshot.queryParamMap.get('password');
    this.role = this.user.snapshot.queryParamMap.get('role');
    console.log('Username:', this.username);
    console.log('Password:', this.password);
    console.log('Role:', this.role);
  }

goToPublicSection() {
  console.log('Navigating to public section with username:', this.username, 'password:', this.password, 'role:', this.role);
  this.router.navigate(['/publicsec'], {
    queryParams: { user: this.username, password: this.password, role: this.role },
  });
}

logout() {
  // Redirect to the login page

  this.router.navigate(['']);
  console.log('Logout successful');
}

}
