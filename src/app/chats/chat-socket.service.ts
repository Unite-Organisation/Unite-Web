import { inject, Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth';
import { CreateMessageRequest, ConversationMessage } from '../models/api-models/chat.models';

type MessageCallback = (message: ConversationMessage) => void;

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService implements OnDestroy {
  private readonly authService = inject(AuthService);

  private client: Client | null = null;
  private connected = false;
  private pendingSubscriptions: {
    destination: string;
    callback: (message: IMessage) => void;
    subscription?: StompSubscription;
  }[] = [];

  /**
   * Deactivates current WebSocket connection and clears internal state.
   * Used when user logs out or when we need to force a fresh connection.
   */
  disconnect(): void {
    const existingClient = this.client;

    this.connected = false;
    this.pendingSubscriptions = [];
    this.client = null;

    if (existingClient && existingClient.active) {
      existingClient.deactivate();
    }
  }

  private buildWsUrl(): string {
    const apiUrl = environment.unite_chatting_ApiUrl || environment.unite_ApiUrl;
    const url = new URL(apiUrl);
    const isSecure = url.protocol === 'https:';

    url.protocol = isSecure ? 'wss:' : 'ws:';
    url.pathname = `${url.pathname.replace(/\/$/, '')}/ws`;

    return url.toString();
  }

  private ensureClient(): void {
    if (this.client) {
      return;
    }

    const wsUrl = this.buildWsUrl();

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      beforeConnect: () => {
        const token = this.authService.getToken();
        if (token && this.client) {
          this.client.connectHeaders = {
            Authorization: `Bearer ${token}`,
          };
        }
      },
      onConnect: () => {
        this.connected = true;

        this.pendingSubscriptions.forEach((sub) => {
          const subscription = this.client?.subscribe(sub.destination, sub.callback);
          if (subscription) {
            sub.subscription = subscription;
          }
        });
      },
      onStompError: (frame) => {
        this.connected = false;
      },
      onWebSocketClose: (event) => {
        this.connected = false;
      },
    });

    this.client.activate();
  }

  private ensureConnected(): void {
    this.ensureClient();
  }

  subscribeToConversation(conversationId: string, callback: MessageCallback): () => void {
    this.ensureConnected();

    const destination = `/topic/conversation/${conversationId}`;
    const messageHandler = (message: IMessage) => {
      if (!message.body) {
        return;
      }
      try {
        const parsed = JSON.parse(message.body) as ConversationMessage;
        callback(parsed);
      } catch {
        return;
      }
    };

    if (this.connected && this.client) {
      const subscription: StompSubscription = this.client.subscribe(destination, messageHandler);
      return () => subscription.unsubscribe();
    }

    const entry: {
      destination: string;
      callback: (message: IMessage) => void;
      subscription?: StompSubscription;
    } = { destination, callback: messageHandler };
    this.pendingSubscriptions.push(entry);
    return () => {
      entry.subscription?.unsubscribe();
      this.pendingSubscriptions = this.pendingSubscriptions.filter((s) => s !== entry);
    };
  }

  sendMessage(request: CreateMessageRequest): void {
    this.ensureConnected();

    if (!this.client || !this.connected) {  
      return;
    }

    this.client.publish({
      destination: '/app/message',
      body: JSON.stringify(request),
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

