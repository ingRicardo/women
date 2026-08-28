import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editmodal } from '../editmodal/editmodal';
import { UserService, User } from '../../services/user.service';
import { retry, timeout, catchError, throwError } from 'rxjs';

export interface NotificationAlert {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, Editmodal],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private userService = inject(UserService);

  // Signal state
  users = signal<User[]>([]);
  selectedRecord = signal<User | null>(null);
  userToDelete = signal<User | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);
  isLoading = signal<boolean>(false);

  // Feedback Notification State
  notification = signal<NotificationAlert | null>(null);

  private notificationTimeout: any;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);

    this.userService
      .getUsers()
      .pipe(
        // Retry 3 times with 3s delays to accommodate Render cold-starts
        retry({ count: 3, delay: 3000 }),
        // Allow up to 60s total for container boot and query execution
        timeout(60000),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (data) => {
          this.isLoading.set(false);
          this.users.set(data);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Failed to load users', err);
          
          if (err.name === 'TimeoutError') {
            this.showNotification('Server is taking longer to wake up. Please refresh.', 'error');
          } else {
            this.showNotification('Failed to load user list from server.', 'error');
          }
        },
      });
  }

  confirmDelete(user: User): void {
    this.userToDelete.set(user);
  }

  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  executeDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.isLoading.set(true);

    this.userService
      .deleteUser(user.id)
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
          this.isLoading.set(false);
          this.users.update((current) => current.filter((u) => u.id !== user.id));
          this.showNotification(`User "${user.name}" was successfully deleted.`, 'success');
          this.userToDelete.set(null);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Failed to delete user', err);
          this.showNotification(`Could not delete "${user.name}". Please try again.`, 'error');
          this.userToDelete.set(null);
        },
      });
  }

  openAddModal(): void {
    this.selectedRecord.set({ id: 0, name: '', username: '', password: '', role: '', email: '' });
  }

  openEditModal(item: User): void {
    this.selectedRecord.set(structuredClone(item));
  }

  saveRecord(submittingItem: User): void {
    this.isLoading.set(true);

    if (!submittingItem.id || submittingItem.id === 0) {
      // CREATE
      const { id, ...newUserData } = submittingItem;

      this.userService
        .createUser(newUserData)
        .pipe(
          retry({ count: 3, delay: 3000 }),
          timeout(60000),
          catchError((err) => {
            this.isLoading.set(false);
            return throwError(() => err);
          })
        )
        .subscribe({
          next: (createdUser) => {
            this.isLoading.set(false);
            this.users.update((current) => [...current, createdUser]);
            this.closeModal();
            this.showNotification(`User "${createdUser.name}" created successfully!`, 'success');
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error('Failed to create user', err);
            
            if (err.status === 409) {
              this.showNotification('Username or email already exists.', 'error');
            } else if (err.name === 'TimeoutError') {
              this.showNotification('Server response timed out. Please check again.', 'error');
            } else {
              this.showNotification('Failed to create user. Please check inputs or connection.', 'error');
            }
          },
        });
    } else {
      // UPDATE
      this.userService
        .updateUser(submittingItem.id, submittingItem)
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
            this.isLoading.set(false);
            this.users.update((current) =>
              current.map((u) => (u.id === submittingItem.id ? submittingItem : u))
            );
            this.closeModal();
            this.showNotification(`User "${submittingItem.name}" updated successfully!`, 'success');
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error('Failed to update user', err);
            this.showNotification('Failed to update user. Please try again.', 'error');
          },
        });
    }
  }

  closeModal(): void {
    this.selectedRecord.set(null);
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

  filteredUsers = computed(() => {
    const query = this.searchTerm().toLowerCase().trim();
    return this.users().filter((user) => user.name.toLowerCase().includes(query));
  });

  totalPages = computed(() => {
    const count = this.filteredUsers().length;
    return Math.ceil(count / this.pageSize()) || 1;
  });

  paginatedUsers = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredUsers().slice(startIndex, startIndex + this.pageSize());
  });

  handleSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}