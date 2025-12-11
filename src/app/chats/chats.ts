import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ConversationService } from './chats.service';
import { ConversationResponse } from '../models/api-models/chat.models';
import { PaginationParams } from '../models/common/common.models';
import { ErrorService } from '../core/error.sevice';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './chats.html',
  styleUrl: './chats.scss',
})
export class Chats implements OnInit {
  private readonly conversationService = inject(ConversationService);
  private readonly errorService = inject(ErrorService);

  conversations: ConversationResponse[] = [];
  selectedConversation: ConversationResponse | null = null;
  isLoading = false;

  private pagination: PaginationParams = {
    page: 1,
    pageSize: 20,
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

  private sortByUpdatedAt(conversations: ConversationResponse[]): ConversationResponse[] {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Newest first
    });
  }

  selectConversation(conversation: ConversationResponse): void {
    this.selectedConversation = conversation;
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
}
