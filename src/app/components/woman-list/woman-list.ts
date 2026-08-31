import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WomanRatesService } from '../../services/woman-rates.service';
import { WomanRatingSummaryDto } from '../models/woman-rate.model';
import { Woman } from '../models/woman.model';
import { WomanService } from '../../services/woman.service';
import { retry, timeout, catchError, throwError } from 'rxjs';

export interface NotificationAlert {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-woman-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './woman-list.html',
  styleUrl: './woman-list.css',
})
export class WomanList implements OnInit {
  private readonly ratesService = inject(WomanRatesService);
  private readonly womanService = inject(WomanService);

  // Signals
  women = signal<Woman[]>([]);
  ratingsMap = signal<Map<number, WomanRatingSummaryDto>>(new Map());
  isLoading = signal<boolean>(false);

  // Guard flag to prevent repeated list fetches
  private isLoaded = false;

  // Form State
  selectedWomanForRating = signal<Woman | null>(null);
  selectedRate = signal<number>(5);

  // Notification State
  notification = signal<NotificationAlert | null>(null);
  private notificationTimeout: any;

  ngOnInit(): void {
    this.loadWomen();
    this.loadRatings();
  }

  loadWomen(): void {
    // Ensures the API request triggers strictly once
    if (this.isLoaded || this.women().length > 0) {
      return;
    }

    this.isLoading.set(true);

    this.womanService
      .getWomen()
      .pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (data) => {
          this.isLoading.set(false);
          this.women.set(data);
          this.isLoaded = true;
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Failed to load women list:', err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Server is taking longer to wake up. Please try refreshing.', 'error');
          } else {
            this.showNotification('Failed to load profile list from server.', 'error');
          }
        },
      });
  }

  loadRatings(): void {
    this.ratesService
      .getAllAverageRates()
      .pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        catchError((err) => throwError(() => err))
      )
      .subscribe({
        next: (summaries) => {
          const map = new Map<number, WomanRatingSummaryDto>();
          summaries.forEach((s) => map.set(s.womanId, s));
          this.ratingsMap.set(map);
        },
        error: (err) => console.error('Failed to load ratings summary:', err),
      });
  }

  openRateModal(woman: Woman): void {
    this.selectedWomanForRating.set(woman);
    this.selectedRate.set(5);
  }

  closeRateModal(): void {
    this.selectedWomanForRating.set(null);
  }

  submitRating(): void {
    const woman = this.selectedWomanForRating();
    if (!woman) return;

    this.isLoading.set(true);

    const dto = {
      womanId: woman.id,
      rate: this.selectedRate(),
    };

    this.ratesService
      .addRate(dto)
      .pipe(
        retry({ count: 2, delay: 2000 }),
        timeout(30000),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          // Fetch updated summary for the specific profile
          this.ratesService
            .getAverageRateForWoman(woman.id)
            .pipe(
              retry({ count: 2, delay: 2000 }),
              timeout(30000),
              catchError((err) => throwError(() => err))
            )
            .subscribe({
              next: (updatedSummary) => {
                this.isLoading.set(false);
                this.ratingsMap.update((map) => {
                  const newMap = new Map(map);
                  newMap.set(woman.id, updatedSummary);
                  return newMap;
                });
                this.showNotification('Rating submitted successfully!', 'success');
              },
              error: (err) => {
                this.isLoading.set(false);
                console.error('Error fetching updated rating:', err);
              },
            });

          this.closeRateModal();
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error adding rating:', err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Request timed out while submitting rating.', 'error');
          } else {
            this.showNotification('Failed to submit rating. Please try again.', 'error');
          }
        },
      });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notification.set({ message, type });

    this.notificationTimeout = setTimeout(() => {
      this.dismissNotification();
    }, 4000);
  }

  dismissNotification(): void {
    this.notification.set(null);
  }
}