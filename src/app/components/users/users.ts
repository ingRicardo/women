import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editmodal } from '../editmodal/editmodal';
import { UserService, User } from '../../services/user.service';

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

  // Feedback Notification State
  notification = signal<NotificationAlert | null>(null);

  private notificationTimeout: any;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => {
        console.error('Failed to load users', err);
        this.showNotification('Failed to load user list from server.', 'error');
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

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((current) => current.filter((u) => u.id !== user.id));
        this.showNotification(`User "${user.name}" was successfully deleted.`, 'success');
        this.userToDelete.set(null);
      },
      error: (err) => {
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
    if (!submittingItem.id || submittingItem.id === 0) {
      // CREATE
      const { id, ...newUserData } = submittingItem;
      this.userService.createUser(newUserData).subscribe({
        next: (createdUser) => {
          this.users.update((current) => [...current, createdUser]);
          this.closeModal();
          this.showNotification(`User "${createdUser.name}" created successfully!`, 'success');
        },
        error: (err) => {
          console.error('Failed to create user', err);
          this.showNotification('Failed to create user. Please check your network or inputs.', 'error');
        },
      });
    } else {
      // UPDATE
      this.userService.updateUser(submittingItem.id, submittingItem).subscribe({
        next: () => {
          this.users.update((current) =>
            current.map((u) => (u.id === submittingItem.id ? submittingItem : u))
          );
          this.closeModal();
          this.showNotification(`User "${submittingItem.name}" updated successfully!`, 'success');
        },
        error: (err) => {
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

    // Auto-dismiss notification after 4 seconds
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