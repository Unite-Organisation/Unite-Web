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
import { CreateAnnDialog } from './create-ann-dialog/create-ann-dialog';
import { RolesService } from '../auth/services/roles.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, AddButton, PostCard, MatDialogModule, MatIconModule],
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
})
export class Announcements implements OnInit {
  private readonly errorService = inject(ErrorService);
  private readonly postService = inject(PostService);
  private readonly dialog = inject(MatDialog);
  private readonly rolesService = inject(RolesService);

  isLoading = false;
  posts: Post[] = [];

  get canCreateAnnouncement(): boolean {
    return this.rolesService.isManager() || this.rolesService.isAdmin();
  }

  openCreateAnnouncementDialog(): void {
    const dialogRef = this.dialog.open(CreateAnnDialog, {
      width: '600px',
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

