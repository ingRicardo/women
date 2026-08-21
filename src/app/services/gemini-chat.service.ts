// src/app/services/gemini-chat.service.ts
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { environment } from '../../../src/environments/environment.development';
export interface ChatMessage {
  sender: 'user' | 'gemini';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiChatService {
  // Replace with your Google AI Studio API Key (https://aistudio.google.com/)
  private readonly apiKey = environment.geminiApiKey;
  private readonly ai = new GoogleGenAI({ apiKey: this.apiKey });

  // System instruction to restrict and focus topics on women's wellness
  private readonly systemInstruction = `
    You are an expert, supportive AI assistant specializing in women's health, fitness, beauty, skin care, and overall wellness.
    Provide helpful, empathetic, evidence-based recommendations and tips.
    If the user asks questions outside women's health, beauty, or fitness, politely redirect them back to these topics.
  `;

  // Reactive message list using Signals
  messages = signal<ChatMessage[]>([
    {
      sender: 'gemini',
      text: "Hello! I'm your wellness assistant. Ask me anything about women's beauty, skincare, fitness routines, or health guidance!"
    }
  ]);

  isLoading = signal<boolean>(false);

  async sendMessage(userPrompt: string): Promise<void> {
    if (!userPrompt.trim() || this.isLoading()) return;

    // Append user message
    this.messages.update(prev => [...prev, { sender: 'user', text: userPrompt }]);
    this.isLoading.set(true);

    try {
      // Use gemini-2.5-flash for fast and cost-free execution
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: this.systemInstruction,
          temperature: 0.7
        }
      });

      const replyText = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

      // Append AI response
      this.messages.update(prev => [...prev, { sender: 'gemini', text: replyText }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      this.messages.update(prev => [
        ...prev,
        { sender: 'gemini', text: 'Error connecting to Gemini. Please check your API key or connectivity.' }
      ]);
    } finally {
      this.isLoading.set(false);
    }
  }
}