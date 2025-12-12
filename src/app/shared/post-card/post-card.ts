import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post, PostType } from '../../models/api-models/posts.models';

@Component({
  selector: 'post-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss'
})
export class PostCard {
  @Input({ required: true }) post!: Post;
  
  defaultImageUrl = 'assets/default-post.jpg';

  get isEvent(): boolean {
    return this.post.postType === PostType.EVENT;
  }

  getImageUrl(): string {
    return this.defaultImageUrl;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-post.png';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

