import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {email, form, FormField, required} from '@angular/forms/signals';
import { UserService } from '../../services/user.service';
import { Authservice } from '../../services/authservice';
interface LoginData {
  user: string;
  password: string;
}

interface RegisterData {
  user: string;
  email: string;
  password: string;
  role: string;
  name: string;
}
@Component({
  selector: 'app-login',
  imports: [FormsModule, FormField],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
private userService = inject(UserService);
private authService = inject(Authservice);
// Toggle signal between login and register views
isRegistering = signal(false);
//  errorMessage = signal<string | null>(null);
successMessage = signal<string | null>(null);
errorMessage = signal<string>(''); 
//registerModel = signal({ user: '', email: '', password: '', role: '', name: '' });
  registerModel = signal<RegisterData>({
    user: '',
    email: '',
    password: '',
    role: '',
    name: '',
  });

  // Switch between forms
  toggleMode() {
    this.isRegistering.update(val => !val);
    this.errorMessage.set(''); // Clear errors when switching
    this.successMessage.set(null);
  }

  // Handle Register submit
onRegisterSubmit(event: Event) {
  event.preventDefault();

  this.errorMessage.set('');
  this.successMessage.set(null);

  // 1. Validation check
  const username = this.registerForm.user().value();
  const password = this.registerForm.password().value();
  const email = this.registerForm.email().value();
  const role = this.registerForm.role().value();
  const name = this.registerForm.name?.().value() || username; // Fallback to username if name isn't present

  if (!username || !password || !email || !role) {
    this.errorMessage.set('Please fill in all required fields.');
    return;
  }

  // 2. Prepare payload matching the User interface (excluding id)
  const newUser = {
    name,
    username,
    password,
    email,
    role
  };

  // 3. Call HTTP API Service
  this.userService.createUser(newUser).subscribe({
    next: (createdUser) => {
      this.successMessage.set('User created successfully!');
      
      // Reset the form model signal
      this.registerModel.set({ user: '', email: '', password: '', role: '', name: '' });
    },
    error: (err) => {
      console.error('Registration error:', err);
      // Handle database duplicate key constraints (e.g. unique username/email) or general API errors
      if (err.status === 409 || err.error?.message) {
        this.errorMessage.set(err.error.message || 'Username or email already exists.');
      } else {
        this.errorMessage.set('An error occurred while creating the user. Please try again.');
      }
    }
  });
}
dismissSuccess() {
  this.successMessage.set(null);
  this.toggleMode(); // Switch back to login page upon closing popup
}
onRegister() {
  throw new Error('Method not implemented.');
}

  loginModel = signal<LoginData>({
    user: '',
    password: '',
  });



  // Register Form Signal Structure
// Define forms using formField wrappers
 // Bind directly to primitive value signals that [formField] expects
  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.user, {message: 'user is required'});
    //email(schemaPath.email, {message: 'Enter a valid email address'});
    required(schemaPath.password, {message: 'Password is required'});
    required(schemaPath.role, {message: 'Role is required'});
    required(schemaPath.email, {message: 'Email is required'});
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.user, {message: 'user is required'});
    //email(schemaPath.email, {message: 'Enter a valid email address'});
    required(schemaPath.password, {message: 'Password is required'});
  });

  username = signal('');
  password = signal('');
  private router = inject(Router);

  isAdmin = signal(false);
  //errorMessage = signal('');
  errorMessageUpper = computed(() => this.errorMessage().toUpperCase());
  isUserFound = signal(false);
onSubmit(event: Event): void {
  event.preventDefault();
  
  // Clear previous state
  this.errorMessage.set('');
  this.isAdmin.set(false);

  const username = this.loginForm.user().value().trim();
  const password = this.loginForm.password().value();

  // 1. Basic validation
  if (!username || !password) {
    this.errorMessage.set('Please enter both username and password.');
    return;
  }

  // 2. Call backend authentication service
  this.authService.login({ username, password }).subscribe({
    next: (user) => {
      // Set role state based on API response
      const isAdminUser = user.role?.toUpperCase() === 'ADMIN';
      this.isAdmin.set(isAdminUser);

      // Route based on user role
      if (isAdminUser) {
        console.log('Admin login successful:', user);
        this.redirectToAdminSection(user);
      } else {
        console.log('User login successful:', user);
        this.redirectToPublicSection(user);
      }
    },
    error: (err) => {
      console.error('Login failed:', err);

      if (err.status === 404) {
        this.errorMessage.set('User not found. Please check your credentials.');
      } else if (err.status === 401) {
        this.errorMessage.set('Invalid credentials. Please try again.');
      } else {
        this.errorMessage.set('Unable to log in. Please try again later.');
      }
    }
  });
}

/*
  onSubmit(event: Event) {
    event.preventDefault();
    // Perform login logic here
    this.errorMessage.set(''); // Clear previous error message
    const credentials = this.loginModel();
    // e.g., await this.authService.login(credentials);
        this.isAdmin.set(false);
      if (this.loginForm.user().value() === '' || this.loginForm.password().value() === '') {
        this.errorMessage.set('Please enter both username and password.');
        // use computed readonly signal for uppercase display
        //return;
      } else if(this.isUserFound() === false) {
        this.errorMessage.set('User not found. Please check your credentials.');
         //return;
      }

    if (credentials.user === 'admin' && credentials.password === 'admin') {
        this.isAdmin.set(true);
        console.log('Admin login successful');
        console.log('Logging in with:', credentials);
        this.redirectToAdminSection();
    }else if (credentials.user === 'user' || credentials.password === 'user') {
        this.isAdmin.set(false);
        console.log('User login successful');
        console.log('Logging in with:', credentials);
        this.redirectToPublicSection();
    }

    if(credentials.user !== 'admin' && credentials.password !== 'admin' && credentials.user !== 'user' && credentials.password !== 'user') {
        this.errorMessage.set('Invalid credentials. Please try again.');
        console.log('Invalid login attempt');
    }
    if(credentials.user === '' && credentials.password === '') {
        this.errorMessage.set('Please enter both username and password.');
        console.log('Empty login attempt');
    }
  }*/

  redirectToAdminSection(user: any) {
  // Redirect to the admin section
  this.router.navigate(['/adminsec'], 
      { 
      queryParams: { user: user.username, password: user.password, role: user.role } 
  });

   }
  redirectToPublicSection(user: any) {
  // Redirect to the public section
    this.router.navigate(['/publicsec'], 
      { 
      queryParams: { user: user.username, password: user.password, role: user.role } 
  });


  }
}
 