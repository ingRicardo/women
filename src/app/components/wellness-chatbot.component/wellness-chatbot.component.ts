import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiChatService } from '../../services/gemini-chat.service';


@Component({
  selector: 'app-wellness-chatbot.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wellness-chatbot.component.html',
  styleUrl: './wellness-chatbot.component.css',
})
export class WellnessChatbotComponent {
readonly chatService = inject(GeminiChatService);
  
  userQuery = signal<string>('');
  isOpen = signal<boolean>(false);

  toggleChat(): void {
    this.isOpen.update(val => !val);
  }

  async handleSend(): Promise<void> {
    const text = this.userQuery();
    if (!text.trim()) return;

    this.userQuery.set('');
    await this.chatService.sendMessage(text);
  }


}
