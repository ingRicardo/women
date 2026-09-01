import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, shareReplay, retry, timeout, catchError, throwError } from 'rxjs';
import { Woman, WomanRatingSummary, CreateRateDto } from '../components/models/woman.model';

@Injectable({
  providedIn: 'root',
})
export class WomanService {
  private http = inject(HttpClient);

  private apiUrl = 'https://womenapi.onrender.com/api/Women';
  private rateApiUrl = 'https://womenapi.onrender.com/api/WomanRates';

  // State Management via Signals
  //private womenState = signal<Woman[]>([]);
  //readonly women = this.womenState.asReadonly();

  // Internal caching flags & streams
  private isLoaded = false;
  private womenObservable$: Observable<Woman[]> | null = null;

  private womenSignal = signal<Woman[]>([]);
  readonly women = this.womenSignal.asReadonly();
  
  getWomen(forceRefresh = false): Observable<Woman[]> {
  return this.http.get<Woman[]>(this.apiUrl).pipe(
    tap((data) => {
      // Force a new array reference so signals detect the change
      this.womenSignal.set([...data]); 
    })
  );
}

  // --- GET Operations with Caching & Resilience ---
/*
  getWomen(forceRefresh = false): Observable<Woman[]> {
    if (forceRefresh || !this.isLoaded || !this.womenObservable$) {
      this.womenObservable$ = this.http.get<Woman[]>(this.apiUrl).pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        tap((data) => {
          this.womenSignal.set(data);
          this.isLoaded = true;
        }),
        shareReplay(1),
        catchError((err) => {
          this.isLoaded = false;
          this.womenObservable$ = null;
          return throwError(() => err);
        })
      );
    }
    return this.womenObservable$;
  }
*/
  getWomanById(id: number): Observable<Woman> {
    return this.http.get<Woman>(`${this.apiUrl}/${id}`).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000)
    );
  }

  // --- CRUD Operations with State Mutation ---

  createWoman(womanData: Omit<Woman, 'id'>): Observable<Woman> {
    return this.http.post<Woman>(this.apiUrl, womanData).pipe(
      retry({ count: 3, delay: 3000 }),
      timeout(60000),
      tap((newWoman) => {
        this.addWomanLocally(newWoman);
      })
    );
  }

  updateWoman(id: number, womanData: Woman): Observable<Woman> {
    return this.http.put<Woman>(`${this.apiUrl}/${id}`, womanData).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000),
      tap(() => {
        this.womenSignal.update((current) =>
          current.map((w) => (w.id === id ? womanData : w))
        );
      })
    );
  }

  deleteWoman(id: number): Observable<void> {
    // Optimistically remove from state
    this.deleteWomanLocally(id);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000),
      catchError((err) => {
        // Restore state from backend if deletion fails
        this.getWomen(true).subscribe();
        return throwError(() => err);
      })
    );
  }

  // --- Local Signal Mutators ---

  addWomanLocally(newWoman: Woman): void {
    this.womenSignal.update((current) => [...current, newWoman]);
  }

  deleteWomanLocally(id: number): void {
    this.womenSignal.update((current) => current.filter((w) => w.id !== id));
  }

  clearCache(): void {
    this.womenSignal.set([]);
    this.isLoaded = false;
    this.womenObservable$ = null;
  }

  // --- Rating Operations ---

  addRating(dto: CreateRateDto): Observable<void> {
    return this.http.post<void>(this.rateApiUrl, dto).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000)
    );
  }

  getAverageRating(womanId: number): Observable<WomanRatingSummary> {
    return this.http.get<WomanRatingSummary>(`${this.rateApiUrl}/average/${womanId}`).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000)
    );
  }

  getAllAverageRatings(): Observable<WomanRatingSummary[]> {
    return this.http.get<WomanRatingSummary[]>(`${this.rateApiUrl}/averages`).pipe(
      retry({ count: 3, delay: 3000 }),
      timeout(60000)
    );
  }
}