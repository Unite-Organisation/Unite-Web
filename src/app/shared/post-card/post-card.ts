import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../models/api-models/posts.models';

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

  getImageUrl(): string {
    return this.defaultImageUrl;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-post.png';
  }
}

