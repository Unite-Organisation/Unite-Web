import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../core/error.sevice';
import { Post, PostType } from '../models/api-models/posts.models';
import { PostService } from '../posts/services/post.service';
import { AddButton } from '../shared/add-button/add-button';
import { PostCard } from '../shared/post-card/post-card';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, AddButton, PostCard],
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
})
export class Announcements implements OnInit {
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
      postType: PostType.ANNOUNCEMENT,
    }).subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load announcements', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }
}

