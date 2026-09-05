import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, shareReplay, retry, timeout, catchError, throwError } from 'rxjs';
import { Woman, WomanRatingSummary, CreateRateDto } from '../components/models/woman.model';

@Injectable({
  providedIn: 'root',
})
export class WomanService {

  private http = inject(HttpClient);

  private apiUrl = 'https://womenapi.onrender.com/api/Women';
  private rateApiUrl = 'https://womenapi.onrender.com/api/WomanRates';

  private womenSignal = signal<Woman[]>([]);
  readonly women = this.womenSignal.asReadonly();

  
  getWomenv1(): Observable<Woman[]> {
    console.log('Fetching women data from API...');
    return this.http.get<Woman[]>(this.apiUrl).pipe(
      tap({
      next: (data) => console.log('Raw data received by service:', data),
      error: (err) => console.error('Service error:', err)
    })
    );
   }

  getWomen(forceRefresh = false): Observable<Woman[]> {
  return this.http.get<Woman[]>(this.apiUrl).pipe(
    tap((data) => {
      // Force a new array reference so signals detect the change
      this.womenSignal.set([...data]); 
    })
  );
}


  getWomanById(id: number): Observable<Woman> {
    return this.http.get<Woman>(`${this.apiUrl}/${id}`).pipe(
      retry({ count: 2, delay: 2000 }),
      timeout(30000)
    );
  }
/*
  createWomanv1(womanData: Omit<Woman, 'id'>): Observable<womanData> {
    console.log('Creating woman with from service :', womanData);
    return this.http.post<Woman>(this.apiUrl, womanData);
  }
 */
    createWomanv1(womanData: Omit<Woman, 'id'>): Observable<Woman> {
      return this.http.post<Woman>(this.apiUrl, womanData);/* .pipe(
       retry({ count: 3, delay: 3000 }),
        timeout(60000),
        tap((newUser) => {
          // Append new record immediately to state signal
          this.womenSignal.update((current) => [...current, newUser]);
        })
      );*/
    }
  


  createWoman(womanData: Omit<Woman, 'id'>): Observable<Woman> {
  return this.http.post<Woman>(this.apiUrl, womanData).pipe(
    retry({ count: 3, delay: 3000 }),
    timeout(60000)
     
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