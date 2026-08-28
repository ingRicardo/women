import { Component, computed, effect, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WomanService } from '../../services/woman.service';
import { Woman } from '../models/woman.model';
import { retry, timeout, catchError, throwError } from 'rxjs';

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

  // Signals synced with template control flow
  isLoadingWomen = signal<boolean>(true);
  isLoadingStats = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  isDeletingId = signal<number | null>(null);

  womanForm: FormGroup;
  private womanService = inject(WomanService);
  women = signal<Woman[]>([]);

  // Notification State
  notification = signal<NotificationAlert | null>(null);
  private notificationTimeout: any;

  // Confirmation Modal Signals
  showDeleteModal = signal<boolean>(false);
  pendingDeleteId = signal<number | null>(null);

  showAddModal = signal<boolean>(false);
  pendingFormData = signal<Omit<Woman, 'id'> | null>(null);

  ngOnInit(): void {
    this.loadWomen();
  }

  loadWomen(): void {
    this.isLoadingWomen.set(true);
    this.isLoadingStats.set(true);

    this.womanService
      .getWomen()
      .pipe(
        retry({ count: 3, delay: 3000 }),
        timeout(60000),
        catchError((err) => {
          this.isLoadingWomen.set(false);
          this.isLoadingStats.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (data) => {
          this.women.set(data);
          this.isLoadingWomen.set(false);
          this.isLoadingStats.set(false);
        },
        error: (err) => {
          this.isLoadingWomen.set(false);
          this.isLoadingStats.set(false);
          console.error('Error fetching women records:', err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Server response timed out. Please try refreshing.', 'error');
          } else {
            this.showNotification('Failed to load records from the server.', 'error');
          }
        },
      });
  }

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

  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  statusStats = computed<StatusStat[]>(() => {
    const list = this.women();
    const total = list.length;
    if (total === 0) return [];

    const statuses = ['Single', 'Married', 'Divorced', 'Widowed'];

    return statuses.map((status) => {
      const count = list.filter((u) => u.status.toLowerCase() === status.toLowerCase()).length;
      const percentage = Math.round((count / total) * 100);
      return { status, count, percentage };
    });
  });

  private palette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  raceStats = computed<StatItem[]>(() => {
    const list = this.women();
    const total = list.length;
    if (total === 0) return [];

    const raceMap = new Map<string, number>();
    list.forEach((u) => {
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

  filteredWomen = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.women();

    return this.women().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q)
    );
  });

  totalPages = computed(() => Math.ceil(this.filteredWomen().length / this.pageSize()));
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

  womenData = output<Woman[]>();

  constructor(private fb: FormBuilder) {
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

  // Request deletion confirmation
  promptRemoveWoman(id: number): void {
    this.pendingDeleteId.set(id);
    this.showDeleteModal.set(true);
  }

  // Execute deletion after confirmation
  confirmRemoveWoman(): void {
    const id = this.pendingDeleteId();
    if (id === null) return;

    this.isDeleting.set(true);
    this.isDeletingId.set(id);

    this.womanService
      .deleteWoman(id)
      .pipe(
        retry({ count: 2, delay: 2000 }),
        timeout(30000),
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
          this.women.update((list) => list.filter((woman) => woman.id !== id));

          if (this.currentPage() > this.totalPages() && this.totalPages() > 0) {
            this.currentPage.set(this.totalPages());
          }
          this.showNotification('Record deleted successfully.', 'success');
          this.cancelDelete();
        },
        error: (err) => {
          this.isDeleting.set(false);
          this.isDeletingId.set(null);
          console.error(`Failed to delete record with ID ${id}:`, err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Delete request timed out.', 'error');
          } else {
            this.showNotification('Failed to delete record.', 'error');
          }
          this.cancelDelete();
        },
      });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.pendingDeleteId.set(null);
  }

  // Request addition confirmation
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

  // Execute creation after confirmation
  confirmAddWoman(): void {
    const newWoman = this.pendingFormData();
    if (!newWoman) return;

    this.isSubmitting.set(true);

    this.womanService
      .createWoman(newWoman)
      .pipe(
        retry({ count: 2, delay: 2000 }),
        timeout(30000),
        catchError((err) => {
          this.isSubmitting.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.women.update((current) => [...current, created]);
          this.womanForm.reset({ status: 'Single' });
          this.showNotification('New record added successfully.', 'success');
          this.cancelAdd();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Failed to create record:', err);
          if (err.name === 'TimeoutError') {
            this.showNotification('Create request timed out.', 'error');
          } else {
            this.showNotification('Failed to create record.', 'error');
          }
          this.cancelAdd();
        },
      });
  }

  cancelAdd(): void {
    this.showAddModal.set(false);
    this.pendingFormData.set(null);
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