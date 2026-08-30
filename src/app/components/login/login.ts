import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { email, form, FormField, required } from '@angular/forms/signals';
import { UserService } from '../../services/user.service';
import { Authservice } from '../../services/authservice';
import { retry, timeout, catchError, throwError } from 'rxjs';

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
  private router = inject(Router);

  isRegistering = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  registerModel = signal<RegisterData>({
    user: '',
    email: '',
    password: '',
    role: '',
    name: '',
  });

  loginModel = signal<LoginData>({
    user: '',
    password: '',
  });

  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.user, { message: 'user is required' });
    required(schemaPath.password, { message: 'Password is required' });
    required(schemaPath.role, { message: 'Role is required' });
    required(schemaPath.email, { message: 'Email is required' });
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.user, { message: 'user is required' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  isAdmin = signal(false);
  errorMessageUpper = computed(() => this.errorMessage().toUpperCase());

  toggleMode() {
    if (this.isLoading()) return;
    this.isRegistering.update((val) => !val);
    this.errorMessage.set('');
    this.successMessage.set(null);
  }

  onRegisterSubmit(event: Event) {
    event.preventDefault();
    if (this.isLoading()) return;

    this.errorMessage.set('');
    this.successMessage.set(null);

    const username = this.registerForm.user().value();
    const password = this.registerForm.password().value();
    const email = this.registerForm.email().value();
    const role = this.registerForm.role().value();
    const name = this.registerForm.name?.().value() || username;

    if (!username || !password || !email || !role) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    const newUser = { name, username, password, email, role };
    this.isLoading.set(true);

    this.userService
      .createUser(newUser)
      .pipe(
        retry({
          count: 3,
          delay: 3000,
        }),
        timeout(60000),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.handleSuccess('User created successfully!');
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Registration error:', err);
        //  this.handleSuccess('User created successfully! (Server took a moment to wake up)');
          if (err.name === 'TimeoutError' || err.message?.includes('Timeout')) {
            // Trigger styled popup modal on timeout
            this.handleSuccess('User created successfully! (Server took a moment to wake up)');
          
          } else if (err.status === 409 || err.error?.message) {
            this.errorMessage.set(err.error.message || 'Username or email already exists.');
          } else {
            this.errorMessage.set('An error occurred while creating the user. Please try again.');
          }
        },
      });
  }

  private handleSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
      //alert(message);
    // Clear registration fields
    this.registerModel.set({ user: '', email: '', password: '', role: '', name: '' });
  }

  dismissSuccess() {
    this.successMessage.set(null);
    this.isRegistering.set(false); // Automatically switches back to Login mode
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isLoading()) return;

    this.errorMessage.set('');
    this.isAdmin.set(false);

    const username = this.loginForm.user().value().trim();
    const password = this.loginForm.password().value();

    if (!username || !password) {
      this.errorMessage.set('Please enter both username and password.');
      return;
    }

    this.isLoading.set(true);

    this.authService
      .login({ username, password })
      .pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (user) => {
          this.isLoading.set(false);
          const isAdminUser = user.role?.toUpperCase() === 'ADMIN';
          this.isAdmin.set(isAdminUser);

          if (isAdminUser) {
            this.redirectToAdminSection(user);
          } else {
            this.redirectToPublicSection(user);
          }
        },
        error: (err) => {
          this.isLoading.set(false);

          if (err.name === 'TimeoutError' || err.message?.includes('Timeout')) {
            this.errorMessage.set(
              'The server is taking longer than expected to wake up. Please click Login again.'
            );
          } else if (err.status === 404) {
            this.errorMessage.set('User not found. Please check your credentials.');
          } else if (err.status === 401) {
            this.errorMessage.set('Invalid credentials. Please try again.');
          } else {
            this.errorMessage.set('Unable to log in. Please check backend logs.');
          }
        },
      });
  }

  redirectToAdminSection(user: any) {
    this.router.navigate(['/adminsec'], {
      queryParams: { user: user.username, password: user.password, role: user.role },
    });
  }

  redirectToPublicSection(user: any) {
    this.router.navigate(['/publicsec'], {
      queryParams: { user: user.username, password: user.password, role: user.role },
    });
  }
}