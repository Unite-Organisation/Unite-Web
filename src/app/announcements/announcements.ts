import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Post, PostType } from '../models/api-models/posts.models';
import { PostService } from '../posts/services/post.service';
import { AddButton } from '../shared/add-button/add-button';
import { PostCard } from '../shared/post-card/post-card';
import { CreateAnnDialog } from './create-ann-dialog/create-ann-dialog';
import { RolesService } from '../auth/services/roles.service';
import { ButtonComponent } from '../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, AddButton, PostCard, MatDialogModule, MatIconModule, ButtonComponent],
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
})
export class Announcements implements OnInit {
  private readonly postService = inject(PostService);
  private readonly dialog = inject(MatDialog);
  private readonly rolesService = inject(RolesService);
  private readonly router = inject(Router);


  isLoading = false;
  posts: Post[] = [];
  selectedPost: Post | null = null;

  private readonly featuredCard = viewChild('featuredCard', { read: ElementRef });

  get canCreateAnnouncement(): boolean {
    return this.rolesService.isManager() || this.rolesService.isAdmin();
  }

  protected createAnnouncement(): void {
    this.router.navigate(['/app/home/announcements/create']);
  }

  selectPost(post: Post): void {
    if (this.selectedPost?.id === post.id) {
      return;
    }

    this.selectedPost = post;
    this.bounceFeaturedCard();
  }

  private bounceFeaturedCard(): void {
    const element = this.featuredCard()?.nativeElement as HTMLElement | undefined;

    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    element.getAnimations().forEach(animation => animation.cancel());

    element.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.985)', opacity: 0.85, offset: 0.3 },
        { transform: 'scale(1.006)', opacity: 1, offset: 0.65 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      {
        duration: 450,
        easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
    );
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
    this.selectedPost = this.posts.length > 0
    ? this.posts[0]
    : null;
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
        this.selectedPost = this.posts.length > 0
        ? this.posts[0]
        : null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load announcements', error);
        this.isLoading = false;
      }
    });
  }
}

