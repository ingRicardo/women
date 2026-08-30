import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, shareReplay, retry, timeout, catchError, throwError } from 'rxjs';

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  role: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://womenapi.onrender.com/api/Users';

  // Internal writable signal state
  private usersState = signal<User[]>([]);
  // Expose as read-only signal for components to consume
  users = this.usersState.asReadonly();

  private isLoaded = false;
  private usersObservable$: Observable<User[]> | null = null;

  getUsers(forceRefresh = false): Observable<User[]> {
    // Return cached data immediately if already fetched and no force refresh requested
    if (this.isLoaded && !forceRefresh) {
      return new Observable((subscriber) => {
        subscriber.next(this.usersState());
        subscriber.complete();
      });
    }

    // Reuse in-flight HTTP request to prevent duplicate network calls
    if (!this.usersObservable$ || forceRefresh) {
      this.usersObservable$ = this.http.get<User[]>(this.apiUrl).pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        tap((data) => {
          this.usersState.set(data);
          this.isLoaded = true;
          this.usersObservable$ = null;
        }),
        shareReplay(1),
        catchError((err) => {
          this.usersObservable$ = null;
          return throwError(() => err);
        })
      );
    }

    return this.usersObservable$;
  }

  createUser(userData: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData).pipe(
      retry({ count: 3, delay: 3000 }),
      timeout(60000),
      tap((newUser) => {
        // Append new record immediately to state signal
        this.usersState.update((current) => [...current, newUser]);
      })
    );
  }

  updateUser(id: number, userData: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000),
      tap(() => {
        // Map updated record into state signal
        this.usersState.update((current) =>
          current.map((u) => (u.id === id ? userData : u))
        );
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    // Optimistically update local signal state immediately
    this.deleteUserLocally(id);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000),
      tap(() => {
        // Confirmed server deletion
      }),
      catchError((err) => {
        // If deletion fails on backend (non-timeout), re-fetch to restore state
        if (err.name !== 'TimeoutError') {
          this.getUsers(true).subscribe();
        }else this.getUsers(true).subscribe();
        return throwError(() => err);
      })
    );
  }

  // Method called by component for immediate local signal mutation
  deleteUserLocally(id: number): void {
    this.usersState.update((current) => current.filter((u) => u.id !== id));
  }

  clearCache(): void {
    this.usersState.set([]);
    this.isLoaded = false;
    this.usersObservable$ = null;
  }
}