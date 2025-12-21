import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ErrorService } from '../core/error.sevice';
import { Post, PostType } from '../models/api-models/posts.models';
import { PostService } from '../posts/services/post.service';
import { AddButton } from '../shared/add-button/add-button';
import { PostCard } from '../shared/post-card/post-card';
import { CreateEventDialog } from './create-event-dialog/create-event-dialog';
import { RolesService } from '../auth/services/roles.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, AddButton, PostCard, MatDialogModule, MatIconModule],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit {
  private readonly errorService = inject(ErrorService);
  private readonly postService = inject(PostService);
  private readonly dialog = inject(MatDialog);
  private readonly rolesService = inject(RolesService);

  isLoading = false;
  posts: Post[] = [];

  get canCreateEvent(): boolean {
    return this.rolesService.isManager() || this.rolesService.isAdmin();
  }

  openCreateEventDialog(): void {
    const dialogRef = this.dialog.open(CreateEventDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadPosts();
      }
    });
  }

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

