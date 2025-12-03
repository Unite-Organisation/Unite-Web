import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../core/error.sevice';
import { Post, PostType } from '../models/api-models/posts.models';
import { PostService } from '../posts/services/post.service';
import { AddButton } from '../shared/add-button/add-button';
import { PostCard } from '../shared/post-card/post-card';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, AddButton, PostCard],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit {
  private readonly errorService = inject(ErrorService);
  private readonly postService = inject(PostService);

  isLoading = false;
  posts: Post[] = [];

  ngOnInit(): void {
    this.loadPosts();
  }

  private loadPosts(): void {
    this.isLoading = true;
    this.postService.getPosts({
      pageSize: 10,
      page: 1,
      postType: PostType.EVENT,
    }).subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load events', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }
}

