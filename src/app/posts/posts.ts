import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ErrorService } from '../core/error.sevice';
import { Post } from '../models/api-models/posts.models';
import { PostService } from './services/post.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AddButton } from '../shared/add-button/add-button';
// import { CreateButton } from '../shared/create-button/create-button';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, AddButton],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts implements OnInit{
  private readonly errorService = inject(ErrorService);
  private readonly postService = inject(PostService);

  isLoading = false;
  posts: Post[] = []
  defaultImageUrl = 'assets/default-post.jpg';

  ngOnInit(): void {
    this.loadPosts();
  }

  getImageUrl(post: Post): string {
    // Jeśli w przyszłości post będzie miał własne zdjęcie, użyjemy go tutaj
    // Na razie używamy domyślnego obrazu
    return this.defaultImageUrl;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Fallback jeśli domyślny obraz też się nie załaduje
    img.src = 'assets/default-post.png';
  }

  private loadPosts(): void {
    const paginationParams = {
      pageSize: 10,
      page: 1,
    };

    this.isLoading = true;
    this.postService.getPosts(paginationParams).subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load posts', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    })
  } 
  
}


