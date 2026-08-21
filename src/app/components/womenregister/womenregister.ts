import { Component, computed, effect, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WomanService } from '../../services/woman.service';
import { Woman } from '../models/woman.model';
/*
interface Woman {
  id: number;
  name: string;
  avatar: string;
  age: number;
  status: string;
  dateofbirth: string;
  country: string;
  race: string;
  email: string;
} */
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

@Component({
  selector: 'app-womenregister',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './womenregister.html',
  styleUrl: './womenregister.css',
})

export class Womenregister implements OnInit {
womanForm: FormGroup;


private womanService = inject(WomanService);
  women = signal<Woman[]>([]);
  
  ngOnInit(): void {
    this.womanService.getWomen().subscribe({
      next: (data) => this.women.set(data),
      error: (err) => console.error('Error fetching women records:', err),
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
    'Prefer not to say'
  ];

  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

 
// Computes counts and percentages for each status reactively
  statusStats = computed<StatusStat[]>(() => {
    const list = this.women();
    const total = list.length;
    if (total === 0) return [];

    const statuses = ['Single', 'Married', 'Divorced', 'Widowed'];
    
    return statuses.map(status => {
      const count = list.filter(u => u.status.toLowerCase() === status.toLowerCase()).length;
      const percentage = Math.round((count / total) * 100);
      return { status, count, percentage };
    });
  });

private palette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
// Race distribution computed values (SVG stroke calculation)
  raceStats = computed<StatItem[]>(() => {
    const list = this.women();
    const total = list.length;
    if (total === 0) return [];

    const raceMap = new Map<string, number>();
    list.forEach(u => {
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
        dashOffset
      });

      currentOffset += strokeDash;
      colorIdx++;
    });

    return items;
  });


filteredWomen = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.women();

    return this.women().filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.country.toLowerCase().includes(q)
    );
  });
// Calculate total pages dynamically
  totalPages = computed(() => Math.ceil(this.filteredWomen().length / this.pageSize()));

  // Array of page numbers for rendering page buttons
  totalPagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  // Slice filtered users to display current page
  paginatedWomen = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredWomen().slice(start, start + this.pageSize());
  });

  // Display calculations (e.g. "Showing 1 - 5 of 7")
  startIndex = computed(() => (this.filteredWomen().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1));
  endIndex = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredWomen().length));
onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1); // Reset to first page on search
  }

  onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page on page size change
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

// 2. Define the output channel
  womenData = output<Woman[]>();

  constructor(private fb: FormBuilder) {
    this.womanForm = this.fb.group({
      avatar: ['', [Validators.required]], // Or leave validators empty if optional
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dateofbirth: ['', Validators.required],
      age: [{ value: '', disabled: false }],
      status: ['Single', Validators.required],
      country: ['', Validators.required],
      race: ['']
    });
    // 3. Automatically send data to parent on init and whenever 'women' signal updates
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


  removeWoman(id: number): void {
  this.womanService.deleteWoman(id).subscribe({
    next: () => {
      // Remove item from local signal list
      this.women.update(list => list.filter(woman => woman.id !== id));

      // Auto-adjust page if deletion empties current page
      if (this.currentPage() > this.totalPages() && this.totalPages() > 0) {
        this.currentPage.set(this.totalPages());
      }
    },
    error: (err) => {
      console.error(`Failed to delete record with ID ${id}:`, err);
    }
  });
}
  onSubmit(): void {
if (this.womanForm.valid) {
    const formValue = this.womanForm.getRawValue();
    
    const newWoman: Omit<Woman, 'id'> = {
      name: formValue.name,
      avatar: formValue.avatar,
      email: formValue.email,
      dateOfBirth: formValue.dateofbirth, // Map form control to C# camelCase model
      age: Number(formValue.age) || 0,
      status: formValue.status,
      country: formValue.country,
      race: formValue.race
    };

    this.womanService.createWoman(newWoman).subscribe({
      next: (created) => {
        this.women.update(current => [...current, created]);
        this.womanForm.reset({ status: 'Single' });
      },
      error: (err) => console.error('Failed to create record:', err)
    });
  }
  }

}
