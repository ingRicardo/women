import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
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

  // Directly bind state to service read-only signal
  women = this.womanService.women;
  ratingsMap = signal<Map<number, WomanRatingSummaryDto>>(new Map());

// Granular Loading Signals
isLoadingList = signal<boolean>(false);
isLoadingRatings = signal<boolean>(false);
isSubmittingRating = signal<boolean>(false);

// Unified Loading Signal for HTML Template
isLoading = computed(() => this.isLoadingList() || this.isLoadingRatings() || this.isSubmittingRating());

  // Form & Rating Modal Signals
  selectedWomanForRating = signal<Woman | null>(null);
  selectedRate = signal<number>(5);

  // Notification State
  notification = signal<NotificationAlert | null>(null);
  private notificationTimeout: any;

  // Table & Filter Signals
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  constructor() {
    // Automatically trigger list fetch when the store is empty or changes are emitted
    effect(() => {
      const currentList = this.women();
      if (currentList.length === 0) {
        this.loadWomen();
      }
    });
  }

  ngOnInit(): void {
    this.loadRatings();
  }

  loadWomen(forceRefresh = false): void {
    if (this.women().length > 0 && !forceRefresh) {
      return;
    }

    this.isLoadingList.set(true);

    this.womanService
      .getWomen(forceRefresh)
      .pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        catchError((err) => {
          this.isLoadingList.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.isLoadingList.set(false);
        },
        error: (err) => {
          this.isLoadingList.set(false);
          console.error('Failed to load women list:', err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Server response timed out. Click refresh to retry.', 'error');
          } else {
            this.showNotification('Failed to load profile list from server.', 'error');
          }
        },
      });
  }

  refreshWomen(): void {
    this.loadWomen(true);
  }

  loadRatings(): void {
    this.isLoadingRatings.set(true);

    this.ratesService
      .getAllAverageRates()
      .pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        catchError((err) => {
          this.isLoadingRatings.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (summaries) => {
          this.isLoadingRatings.set(false);
          const map = new Map<number, WomanRatingSummaryDto>();
          summaries.forEach((s) => map.set(s.womanId, s));
          this.ratingsMap.set(map);
        },
        error: (err) => {
          this.isLoadingRatings.set(false);
          console.error('Failed to load ratings summary:', err);
        },
      });
  }

  // --- Filtering & Pagination Computations ---

  filteredWomen = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.women();

    return this.women().filter(
      (u: Woman) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q)
    );
  });

  totalPages = computed(() => Math.ceil(this.filteredWomen().length / this.pageSize()) || 1);
  totalPagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  paginatedWomen = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredWomen().slice(start, start + this.pageSize());
  });

  startIndex = computed(() =>
    this.filteredWomen().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1
  );
  endIndex = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredWomen().length)
  );

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // --- Modal & Rating Handlers ---

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

    this.isSubmittingRating.set(true);

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
          this.isSubmittingRating.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.ratesService
            .getAverageRateForWoman(woman.id)
            .pipe(
              retry({ count: 2, delay: 2000 }),
              timeout(30000),
              catchError((err) => throwError(() => err))
            )
            .subscribe({
              next: (updatedSummary) => {
                this.isSubmittingRating.set(false);
                this.ratingsMap.update((map) => {
                  const newMap = new Map(map);
                  newMap.set(woman.id, updatedSummary);
                  return newMap;
                });
                this.showNotification('Rating submitted successfully!', 'success');
              },
              error: (err) => {
                this.isSubmittingRating.set(false);
                console.error('Error fetching updated rating:', err);
              },
            });

          this.closeRateModal();
        },
        error: (err) => {
          this.isSubmittingRating.set(false);
          console.error('Error adding rating:', err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Request timed out while submitting rating.', 'error');
          } else {
            this.showNotification('Failed to submit rating. Please try again.', 'error');
          }
        },
      });
  }

  // --- Notifications ---

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