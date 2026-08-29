import { Component, input, output, effect, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editmodal',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './editmodal.html',
  styleUrl: './editmodal.css',
})
export class Editmodal {
  record = input.required<any>();
  isLoading = input<boolean>(false); // Tracks pending API operations
  
  save = output<any>();
  cancel = output<void>();

  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialogElement');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.record()) {
        if (!el.open) el.showModal();
      } else {
        el.close();
      }
    });
  }

  onSave() {
    if (this.isLoading()) return;
    this.save.emit(this.record());
  }

  onCancel() {
    if (this.isLoading()) return; // Prevents closing while saving
    this.cancel.emit();
  }
}