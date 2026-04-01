import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConversationService } from './chats.service';
import { ConversationMessage, ConversationResponse, UserMetaInfo } from '../models/api-models/chat.models';
import { PaginationParams } from '../models/common/common.models';
import { ErrorService } from '../core/error.sevice';
import { ToastService } from '../core/toast.service';
import { finalize } from 'rxjs/operators';
import { CreateGroupDialog } from './create-group-dialog/create-group-dialog';
import { RolesService } from '../auth/services/roles.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatSocketService } from './chat-socket.service';
import { AuthService } from '../auth/services/auth';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './chats.html',
  styleUrl: './chats.scss',
})
export class Chats implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private readonly conversationService = inject(ConversationService);
  private readonly errorService = inject(ErrorService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  protected readonly rolesService = inject(RolesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chatSocketService = inject(ChatSocketService);
  private readonly authService = inject(AuthService);

  conversations: ConversationResponse[] = [];
  messages: ConversationMessage[] = [];
  selectedConversation: ConversationResponse | null = null;
  messageInput = '';
  isLoading = false;
  isLoadingMessages = false;
  isSending = false;
  private currentUserId: string | null = null;

  private pagination: PaginationParams = {
    page: 1,
    pageSize: 20,
  };

  readonly messagePageSize = 50;
  hasMoreMessages = true;
  isLoadingOlderMessages = false;
  private oldestMessageId: string | null = null;

  private conversationUnsubscribe?: () => void;

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.chatSocketService.disconnect();
  }

  ngOnInit(): void {
    this.loadCurrentUserId();
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.cleanUpConversation();
    this.chatSocketService.disconnect();
  }

  private cleanUpConversation(): void {
    if (this.conversationUnsubscribe) {
      this.conversationUnsubscribe();
      this.conversationUnsubscribe = undefined;
    }
  }

  private loadConversations(): void {
    this.isLoading = true;
    this.conversationService.fetchAllConversations(this.pagination)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          
          // Check if we need to select a specific conversation from query params
          const conversationId = this.route.snapshot.queryParams['conversationId'];
          if (conversationId) {
            const conversation = this.conversations.find(c => c.id === conversationId);
            if (conversation) {
              this.selectConversation(conversation);
              // Clear the query param after selecting
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {}
              });
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load conversations', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  private loadCurrentUserId(): void {
    const metaRaw = localStorage.getItem('user-meta-info');
    if (metaRaw) {
      try {
        const meta: UserMetaInfo = JSON.parse(metaRaw);
        this.currentUserId = meta.userId;
        return;
      } catch (error) {
        console.error('Failed to parse user meta info from localStorage', error);
      }
    }

    this.currentUserId = this.authService.getCurrentUserId();
  }

  private loadMessages(conversationId: string): void {
    this.isLoadingMessages = true;
    this.messages = [];
    this.oldestMessageId = null;
    this.hasMoreMessages = false;
    
    this.conversationService.fetchConversationContent(conversationId, null, this.messagePageSize)
      .pipe(finalize(() => (this.isLoadingMessages = false)))
      .subscribe({
        next: (messages) => {
          this.messages = messages.reverse();

          if (this.messages.length > 0) {
            this.oldestMessageId = this.messages[0].id
          }

          this.hasMoreMessages = messages.length === this.messagePageSize;
      
          this.scrollToBottom();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load messages', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  loadOlderMessages(): void {
    if (!this.selectedConversation || !this.oldestMessageId || this.isLoadingOlderMessages) {
      return;
    }

    this.isLoadingOlderMessages = true;

    const container = this.messagesContainer.nativeElement;
    const previousScrollHeight = container.scrollHeight;

    this.conversationService.fetchConversationContent(
      this.selectedConversation.id,
      this.oldestMessageId,
      this.messagePageSize
    )
    .pipe(finalize(() => (this.isLoadingOlderMessages = false)))
    .subscribe({
      next: (olderMessages) => {
        if (olderMessages.length === 0) {
            this.hasMoreMessages = false;
            return;
        }

        const reversedOlderMessages = olderMessages.reverse();
        this.oldestMessageId = reversedOlderMessages[0].id;
        this.messages = [...reversedOlderMessages, ...this.messages];
        this.hasMoreMessages = olderMessages.length === this.messagePageSize;

        setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }, 0);
      },
      error: (error: HttpErrorResponse) => {
          console.error('Failed to load older messages', error);
          this.toast.error('Nie udało się załadować historii.');
        }
    })
  }

  sendMessage(): void {
    if (!this.selectedConversation || !this.messageInput.trim() || this.isSending) {
      return;
    }

    const content = this.messageInput.trim();
    this.isSending = true;

    try {
      this.chatSocketService.sendMessage({
        conversationId: this.selectedConversation.id,
        content,
      });
      this.messageInput = '';
    } catch (error) {
      console.error('Failed to send message via WebSocket', error);
      this.toast.error('Nie udało się wysłać wiadomości.');
    } finally {
      this.isSending = false;
    }
  }

  isOwnMessage(message: ConversationMessage): boolean {
    if (!this.currentUserId) {
      this.loadCurrentUserId();
    }
    return !!this.currentUserId && message.authorId === this.currentUserId;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
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
    this.cleanUpConversation();
    this.selectedConversation = conversation;
    this.messageInput = '';
    this.loadMessages(conversation.id);

    this.conversationUnsubscribe = this.chatSocketService.subscribeToConversation(
      conversation.id,
      (message) => {
        if (this.selectedConversation?.id === conversation.id) {
        this.messages.push(message); 
        this.scrollToBottom();
      }
      }
    );
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
    const currentDate = new Date(this.messages[index].sentAt).toDateString();
    const previousDate = new Date(this.messages[index - 1].sentAt).toDateString();
    return currentDate !== previousDate;
  }

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(CreateGroupDialog, {
      width: '550px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadConversations();
      }
    });
  }
}
