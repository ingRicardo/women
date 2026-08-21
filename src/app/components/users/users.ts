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
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  ngOnInit(): void {
    this.loadUsers();
  }
  // Fetch users from API
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Failed to load users', err),
    });
  }

  // Delete user via API
  deleteUser(userToDelete: User): void {
    if (!confirm(`Are you sure you want to delete ${userToDelete.name}?`)) return;

    console.log('Deleting user:', userToDelete);
    this.userService.deleteUser(userToDelete.id).subscribe({
      next: () => {
        this.users.update((current) => current.filter((u) => u.id !== userToDelete.id));
      },
      error: (err) => console.error('Failed to delete user', err),
    });
  }

  // Open modal for adding
  openAddModal(): void {
    this.selectedRecord.set({ id: 0, name: '', username: '', password: '', role: '', email: '' });
  }

  // Open modal for editing
  openEditModal(item: User): void {
    this.selectedRecord.set(structuredClone(item));
  }

  // Handle both Create and Update
  saveRecord(submittingItem: User): void {
    if (!submittingItem.id || submittingItem.id === 0) {
      console.log('Creating new user:', submittingItem);
      // CREATE
      const { id, ...newUserData } = submittingItem;
      console.log('New user data to send:', newUserData);
      this.userService.createUser(newUserData).subscribe({
        next: (createdUser) => {
          this.users.update((current) => [...current, createdUser]);
          this.closeModal();
        },
        error: (err) => console.error('Failed to create user', err),
      });
    } else {
      // UPDATE
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

  // Search & Pagination Computed Signals
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
/*
deleteUser(_t14: User) {
 const userId = _t14.id;
  // Filter out the user with the matching ID
  const updatedUsers = this.users().filter(user => user.id !== userId);
  
  this.users.set(updatedUsers);
}
  */
/*
  // Signal containing raw data
  users = signal<User[]>([
    { id: 1, name: 'Alice Smith', username: 'alice_smith', password: 'password123', role: 'Admin' },
    { id: 2, name: 'Bob Jones', username: 'bob_jones', password: 'password123', role: 'Developer' },
    { id: 3, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 4, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 5, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 6, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 7, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 8, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 9, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 10, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 11, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 12, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },
    { id: 13, name: 'Charlie Brown', username: 'charlie_brown', password: 'password123', role: 'Designer' },

  ]);
*/
//selectedRecord = signal<any>(null);

  // 1. Triggered by the "Add" button
/*  openAddModal() {
    this.selectedRecord.set({ id: null, name: '', username: '', password: '', role: '' });
  }
*/
  // 2. Triggered by the table "Edit" buttons
 /* openEditModal(item: any) {
    this.selectedRecord.set(structuredClone(item));
  }
*/
  // 3. Handles both creating and editing
 /* saveRecord(submittingItem: any) {
    if (submittingItem.id === null) {
      // ADDING NEW: Generate a random/incremental ID and append it to the list
      const nextId = this.users().length > 0 ? Math.max(...this.users().map(u => u.id)) + 1 : 1;
      const newRecord = { ...submittingItem, id: nextId };
      
      this.users.update(currentUsers => [...currentUsers, newRecord]);
    } else {
      // UPDATING EXISTING: Map and replace
      this.users.update(currentUsers => 
        currentUsers.map(user => user.id === submittingItem.id ? submittingItem : user)
      );
    }
    
    this.closeModal();
  }
*/
/*
  closeModal() {
    this.selectedRecord.set(null);
  }
*/
  // Signal for a search filter string
 /*
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5); // Kept small to easily see pagination change
*/
  // 3. Step 1: Filter raw data by name string
 /* filteredUsers = computed(() => {
    const query = this.searchTerm().toLowerCase().trim();
    return this.users().filter(user => 
      user.name.toLowerCase().includes(query)
    );
  });
*/
  // 4. Step 2: Compute totals using the filtered list length, not raw length
 /* totalPages = computed(() => {
    const count = this.filteredUsers().length;
    return Math.ceil(count / this.pageSize()) || 1;
  });
*/
  // 5. Step 3: Slice the filtered list down to the active page window
/*  paginatedUsers = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.filteredUsers().slice(startIndex, endIndex);
  });
*/
  // 6. State Mutators
/*  handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.currentPage.set(1); // Reset to page 1 to prevent out-of-bounds page values
  }
*/
/*
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
*/
  
}

