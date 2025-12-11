import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConversationService } from './chats.service';
import { ConversationMessage, ConversationResponse } from '../models/api-models/chat.models';
import { PaginationParams } from '../models/common/common.models';
import { ErrorService } from '../core/error.sevice';
import { ToastService } from '../core/toast.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  templateUrl: './chats.html',
  styleUrl: './chats.scss',
})
export class Chats implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private readonly conversationService = inject(ConversationService);
  private readonly errorService = inject(ErrorService);
  private readonly toast = inject(ToastService);

  conversations: ConversationResponse[] = [];
  messages: ConversationMessage[] = [];
  selectedConversation: ConversationResponse | null = null;
  messageInput = '';
  isLoading = false;
  isLoadingMessages = false;
  isSending = false;

  private pagination: PaginationParams = {
    page: 1,
    pageSize: 20,
  };

  private messagesPagination: PaginationParams = {
    page: 1,
    pageSize: 50,
  };

  ngOnInit(): void {
    this.loadConversations();
  }

  private loadConversations(): void {
    this.isLoading = true;
    this.conversationService.fetchAllConversations(this.pagination)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (conversations) => {
          this.conversations = this.sortByUpdatedAt(conversations);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load conversations', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  private loadMessages(conversationId: string): void {
    this.isLoadingMessages = true;
    this.messages = [];
    
    this.conversationService.fetchConversationContent(conversationId, this.messagesPagination)
      .pipe(finalize(() => (this.isLoadingMessages = false)))
      .subscribe({
        next: (response) => {
          this.messages = this.sortMessagesByDate(response.conversationMessages);
          this.scrollToBottom();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load messages', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  sendMessage(): void {
    if (!this.selectedConversation || !this.messageInput.trim() || this.isSending) {
      return;
    }

    const content = this.messageInput.trim();
    this.isSending = true;

    this.conversationService.sendMessage({
      conversationId: this.selectedConversation.id,
      content
    })
      .pipe(finalize(() => (this.isSending = false)))
      .subscribe({
        next: () => {
          this.messageInput = '';
          this.loadMessages(this.selectedConversation!.id);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to send message', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private sortByUpdatedAt(conversations: ConversationResponse[]): ConversationResponse[] {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Newest first in list
    });
  }

  private sortMessagesByDate(messages: ConversationMessage[]): ConversationMessage[] {
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.sendAt).getTime();
      const dateB = new Date(b.sendAt).getTime();
      return dateA - dateB; // Oldest first (newest at bottom)
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  selectConversation(conversation: ConversationResponse): void {
    this.selectedConversation = conversation;
    this.messageInput = '';
    this.loadMessages(conversation.id);
  }

  isSelected(conversation: ConversationResponse): boolean {
    return this.selectedConversation?.id === conversation.id;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pl-PL', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    }
  }

  formatMessageTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const currentDate = new Date(this.messages[index].sendAt).toDateString();
    const previousDate = new Date(this.messages[index - 1].sendAt).toDateString();
    return currentDate !== previousDate;
  }
}
