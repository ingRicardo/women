import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from './user.service';
export interface LoginCredentials {
  username: string;
  password?: string;
}
@Injectable({
  providedIn: 'root',
})
export class Authservice {
  
  private http = inject(HttpClient);
  //private apiUrl = 'https://localhost:7099/api/Auth'; // Adjust endpoint URL/port as needed
  private apiUrl = 'https://womenapi.onrender.com/api/Auth'; // Adjust endpoint URL/port as needed
  // Signal storing currently logged-in user state
  currentUser = signal<User | null>(null);

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
      tap((user) => {
        this.currentUser.set(user);
        // Optional: Persist user/role in localStorage
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('user');
  }
}
