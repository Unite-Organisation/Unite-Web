import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Post, PostType } from '../models/api-models/posts.models';
import { PostService } from '../posts/services/post.service';
import { AddButton } from '../shared/add-button/add-button';
import { PostCard } from '../shared/post-card/post-card';
import { RolesService } from '../auth/services/roles.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, AddButton, PostCard, MatDialogModule, MatIconModule, ButtonComponent],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit {
  private readonly postService = inject(PostService);
  private readonly dialog = inject(MatDialog);
  private readonly rolesService = inject(RolesService);
  private readonly router = inject(Router);

  isLoading = false;
  posts: Post[] = [];
  selectedPost: Post | null = null;

  selectPost(post: Post): void {
    this.selectedPost = post;
  }

  get canCreateEvent(): boolean {
    return this.rolesService.isManager() || this.rolesService.isResident();
  }


  ngOnInit(): void {
    this.loadPosts();
  }

  createEvent(): void {
    // the same card a guest gets - a public event works the same whether its host has an account
    this.router.navigateByUrl('/e/new');
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
        this.selectedPost = this.posts.length > 0
        ? this.posts[0]
        : null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load events', error);
        this.isLoading = false;
      }
    });
  }

}

