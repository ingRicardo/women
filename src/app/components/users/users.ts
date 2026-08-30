import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editmodal } from '../editmodal/editmodal';
import { UserService, User } from '../../services/user.service';
import { catchError, throwError } from 'rxjs';

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

  // Directly bind component state to service read-only signal
  users = this.userService.users;
  
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

  loadUsers(forceRefresh = false): void {
    if (this.users().length > 0 && !forceRefresh) {
      return;
    }

    this.isLoading.set(true);

    this.userService
      .getUsers(forceRefresh)
      .pipe(
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Failed to load users', err);
          
          if (err.name === 'TimeoutError') {
            this.showNotification('Server response timed out. Click refresh to retry.', 'error');
          } else {
            this.showNotification('Failed to load user list from server.', 'error');
          }
        },
      });
  }

  refreshUsers(): void {
    this.loadUsers(true);
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

    // 1. Trigger local removal if UserService supports direct signal update
    this.removeUserFromLocalState(user.id);

    this.userService
      .deleteUser(user.id)
      .pipe(
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showNotification(`User "${user.name}" was successfully deleted.`, 'success');
          
          this.userToDelete.set(null);
          this.loadUsers(true);
          this.adjustPageAfterDelete();
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Failed to delete user', err);

          this.userToDelete.set(null);

          if (err.name === 'TimeoutError') {
            this.showNotification(`Server timed out while deleting "${user.name}". Table view updated locally.`, 'error');
          } else {
            this.showNotification(`Could not delete "${user.name}". Please try again.`, 'error');
          }

          // Force fresh load from API and re-calculate page boundaries
          this.loadUsers(true);
          this.adjustPageAfterDelete();
        },
      });
  }

  private removeUserFromLocalState(userId: number): void {
    // Calls local state update on UserService if implemented
    if (typeof (this.userService as any).deleteUserLocally === 'function') {
      (this.userService as any).deleteUserLocally(userId);
    }
  }

  private adjustPageAfterDelete(): void {
    if (this.paginatedUsers().length === 0 && this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  openAddModal(): void {
    this.selectedRecord.set({ id: 0, name: '', username: '', password: '', role: '', email: '' });
  }

  openEditModal(item: User): void {
    this.selectedRecord.set(structuredClone(item));
  }

  saveRecord(submittingItem: User): void {
    this.isLoading.set(true);

    const isNew = !submittingItem.id || submittingItem.id === 0;

    if (isNew) {
      // CREATE
      const { id, ...newUserData } = submittingItem;

      this.userService
        .createUser(newUserData)
        .pipe(
          catchError((err) => {
            this.isLoading.set(false);
            return throwError(() => err);
          })
        )
        .subscribe({
          next: (createdUser) => {
            this.isLoading.set(false);
            this.closeModal();
            this.loadUsers(true);
            this.showNotification(`User "${createdUser.name}" created successfully!`, 'success');
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error('Failed to create user', err);

            this.closeModal();
            this.loadUsers(true);

            if (err.name === 'TimeoutError') {
              this.showNotification('Server timed out. Table refreshed to check processing status.', 'error');
            } else if (err.status === 409) {
              this.showNotification('Username or email already exists.', 'error');
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
          catchError((err) => {
            this.isLoading.set(false);
            return throwError(() => err);
          })
        )
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.closeModal();
            this.loadUsers(true);
            this.showNotification(`User "${submittingItem.name}" updated successfully!`, 'success');
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error('Failed to update user', err);

            this.closeModal();
            this.loadUsers(true);

            if (err.name === 'TimeoutError') {
              this.showNotification('Server timed out. Table refreshed to check processing status.', 'error');
            } else {
              this.showNotification('Failed to update user. Please try again.', 'error');
            }
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