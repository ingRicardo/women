import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Editmodal } from '../editmodal/editmodal';
import { UserService, User } from '../../services/user.service';
/*
interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: string;
}
*/
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [Editmodal],
  templateUrl: './users.html',
  styleUrl: './users.css',
})

export class Users implements OnInit {
 
private userService = inject(UserService);

  // Signal state
  users = signal<User[]>([]);
  selectedRecord = signal<User | null>(null);
  userToDelete = signal<User | null>(null); // Signal for delete confirmation modal
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Failed to load users', err),
    });
  }

  // Open confirmation modal
  confirmDelete(user: User): void {
    this.userToDelete.set(user);
  }

  // Cancel deletion
  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  // Execute API delete call
  executeDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((current) => current.filter((u) => u.id !== user.id));
        this.userToDelete.set(null);
      },
      error: (err) => {
        console.error('Failed to delete user', err);
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
      const { id, ...newUserData } = submittingItem;
      this.userService.createUser(newUserData).subscribe({
        next: (createdUser) => {
          this.users.update((current) => [...current, createdUser]);
          this.closeModal();
        },
        error: (err) => console.error('Failed to create user', err),
      });
    } else {
      this.userService.updateUser(submittingItem.id, submittingItem).subscribe({
        next: () => {
          this.users.update((current) =>
            current.map((u) => (u.id === submittingItem.id ? submittingItem : u))
          );
          this.closeModal();
        },
        error: (err) => console.error('Failed to update user', err),
      });
    }
  }

  closeModal(): void {
    this.selectedRecord.set(null);
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

