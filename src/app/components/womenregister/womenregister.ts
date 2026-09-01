import { Component, computed, effect, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WomanService } from '../../services/woman.service';
import { Woman } from '../models/woman.model';
import { catchError, throwError } from 'rxjs';

export interface StatusStat {
  status: string;
  count: number;
  percentage: number;
}

export interface StatItem {
  label: string;
  count: number;
  percentage: number;
  color?: string;
  dashArray?: string;
  dashOffset?: number;
}

export interface NotificationAlert {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-womenregister',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './womenregister.html',
  styleUrl: './womenregister.css',
})
export class Womenregister implements OnInit {
  private womanService = inject(WomanService);
  private fb = inject(FormBuilder);

  // Directly bind component state to service read-only signal
  women = this.womanService.women;

  // Granular Loading Signals (Matched to Template bindings)
  isLoadingWomen = signal<boolean>(false);
  isLoadingStats = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  isDeletingId = signal<number | null>(null);

  womanForm: FormGroup;
  womenData = output<Woman[]>();

  // Notification State
  notification = signal<NotificationAlert | null>(null);
  private notificationTimeout: any;

  // Modal State Signals
  showDeleteModal = signal<boolean>(false);
  pendingDeleteId = signal<number | null>(null);

  showAddModal = signal<boolean>(false);
  pendingFormData = signal<Omit<Woman, 'id'> | null>(null);

  // Table & Filter Signals
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  raceOptions: string[] = [
    'American Indian or Alaska Native',
    'Asian',
    'Black and African American',
    'Hispanic or Latino',
    'Native Hawaiian or Other Pacific Islander',
    'White / Caucasian',
    'Two or More Races',
    'Other',
    'Prefer not to say',
  ];

  private palette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  constructor() {
    this.womanForm = this.fb.group({
      avatar: ['', [Validators.required]],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dateofbirth: ['', Validators.required],
      age: [{ value: '', disabled: false }],
      status: ['Single', Validators.required],
      country: ['', Validators.required],
      race: [''],
    });

    effect(() => {
      this.womenData.emit(this.women());
    });
  }

  ngOnInit(): void {
    this.loadWomen();
  }

  loadWomen(forceRefresh = false): void {
    if (this.women().length > 0 && !forceRefresh) {
      return;
    }

    this.isLoadingWomen.set(true);

    this.womanService
      .getWomen(forceRefresh)
      .pipe(
        catchError((err) => {
          this.isLoadingWomen.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.isLoadingWomen.set(false);
        },
        error: (err) => {
          this.isLoadingWomen.set(false);
          console.error('Error fetching women records:', err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Server response timed out. Click refresh to retry.', 'error');
          } else {
            this.showNotification('Failed to load records from the server.', 'error');
          }
        },
      });
  }

  refreshWomen(): void {
    this.loadWomen(true);
  }

  // --- Statistics Computations ---

  statusStats = computed<StatusStat[]>(() => {
    const list = this.women();
    const total = list.length;
    if (total === 0) return [];

    const statuses = ['Single', 'Married', 'Divorced', 'Widowed'];

    return statuses.map((status) => {
      const count = list.filter((u: Woman) => u.status.toLowerCase() === status.toLowerCase()).length;
      const percentage = Math.round((count / total) * 100);
      return { status, count, percentage };
    });
  });

  raceStats = computed<StatItem[]>(() => {
    const list = this.women();
    const total = list.length;
    if (total === 0) return [];

    const raceMap = new Map<string, number>();
    list.forEach((u: Woman) => {
      const r = u.race || 'Other';
      raceMap.set(r, (raceMap.get(r) || 0) + 1);
    });

    let currentOffset = 0;
    const items: StatItem[] = [];
    let colorIdx = 0;

    raceMap.forEach((count, label) => {
      const percentage = Math.round((count / total) * 100);
      const strokeDash = (percentage * 100) / 100;
      const dashArray = `${strokeDash} ${100 - strokeDash}`;
      const dashOffset = -currentOffset;

      items.push({
        label,
        count,
        percentage,
        color: this.palette[colorIdx % this.palette.length],
        dashArray,
        dashOffset,
      });

      currentOffset += strokeDash;
      colorIdx++;
    });

    return items;
  });

  // --- Filtering & Pagination ---

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

  // --- Form & Action Handlers ---

  onDobChange(): void {
    const dobValue = this.womanForm.get('dateofbirth')?.value;
    if (dobValue) {
      const birthDate = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      this.womanForm.patchValue({ age });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.womanForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // --- Deletion Workflow ---

  promptRemoveWoman(id: number): void {
    this.pendingDeleteId.set(id);
    this.showDeleteModal.set(true);
  }

  confirmRemoveWoman(): void {
    const id = this.pendingDeleteId();
    if (id === null) return;

    this.isDeleting.set(true);
    this.isDeletingId.set(id);
    this.removeWomanFromLocalState(id);

    this.womanService
      .deleteWoman(id)
      .pipe(
        catchError((err) => {
          this.isDeleting.set(false);
          this.isDeletingId.set(null);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.isDeletingId.set(null);
          this.showNotification('Record deleted successfully.', 'success');
          this.cancelDelete();
          
          this.loadWomen(true);
          this.adjustPageAfterDelete();
        },
        error: (err) => {
          this.isDeleting.set(false);
          this.isDeletingId.set(null);
          console.error(`Failed to delete record with ID ${id}:`, err);
          this.cancelDelete();

          if (err.name === 'TimeoutError') {
            this.showNotification('Server timed out. Table view updated locally.', 'error');
          } else {
            this.showNotification('Failed to delete record. Please try again.', 'error');
          }

          this.loadWomen(true);
          this.adjustPageAfterDelete();
        },
      });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.pendingDeleteId.set(null);
    this.isDeletingId.set(null);
  }

  private removeWomanFromLocalState(id: number): void {
    if (typeof (this.womanService as any).deleteWomanLocally === 'function') {
      (this.womanService as any).deleteWomanLocally(id);
    }
  }

  private adjustPageAfterDelete(): void {
    if (this.paginatedWomen().length === 0 && this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  // --- Creation Workflow ---

  onSubmit(): void {
    if (this.womanForm.valid) {
      const formValue = this.womanForm.getRawValue();

      const newWoman: Omit<Woman, 'id'> = {
        name: formValue.name,
        avatar: formValue.avatar,
        email: formValue.email,
        dateOfBirth: formValue.dateofbirth,
        age: Number(formValue.age) || 0,
        status: formValue.status,
        country: formValue.country,
        race: formValue.race,
      };

      this.pendingFormData.set(newWoman);
      this.showAddModal.set(true);
    }
  }

  confirmAddWoman(): void {
    const newWoman = this.pendingFormData();
    if (!newWoman) return;

    this.isSubmitting.set(true);

    this.womanService
      .createWoman(newWoman)
      .pipe(
        catchError((err) => {
          this.isSubmitting.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (createdWoman: Woman) => {
          this.isSubmitting.set(false);
          this.cancelAdd();
          this.womanForm.reset({ status: 'Single' });

          if (typeof (this.womanService as any).addWomanLocally === 'function') {
            const recordToAdd = createdWoman?.id ? createdWoman : { ...newWoman, id: Date.now() };
            (this.womanService as any).addWomanLocally(recordToAdd);
          }

          this.loadWomen(true);

          const lastPage = Math.ceil(this.women().length / this.pageSize()) || 1;
          this.currentPage.set(lastPage);

          this.showNotification('New record added successfully.', 'success');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Failed to create record:', err);
          this.cancelAdd();
          
          this.loadWomen(true);

          if (err.name === 'TimeoutError') {
            this.showNotification('Server timed out. Table refreshed to check processing status.', 'error');
          } else {
            this.showNotification('Failed to create record. Please check inputs or connection.', 'error');
          }
        },
      });
  }

  cancelAdd(): void {
    this.showAddModal.set(false);
    this.pendingFormData.set(null);
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