import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [

    {
        path: 'home',
        loadComponent: () => import('./home/home').then(m => m.Home),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./home/home-dashboard/home-dashboard').then(m => m.HomeDashboard)
            },
            {
                path: 'polls',
                loadComponent: () => import('./polls/polls').then(m => m.Polls)
            },
            {
                path: 'announcements',
                loadComponent: () => import('./announcements/announcements').then(m => m.Announcements)
            },
            {
                path: 'events',
                loadComponent: () => import('./events/events').then(m => m.Events)
            },
            {
                path: 'facilities',
                loadComponent: () => import('./facilities/facilities').then(m => m.Facilities)
            },
            {
                path: 'offerings',
                loadComponent: () => import('./offerings/offerings').then(m => m.Offerings)
            },
            {
                path: 'issues',
                loadComponent: () => import('./issues/issues').then(m => m.Issues)
            },
            {
                path: 'chats',
                loadComponent: () => import('./chats/chats').then(m => m.Chats)
            },
            {
                path: 'settings',
                loadComponent: () => import('./settings/settings').then(m => m.Settings)
            },
            {
                path: 'buildings',
                loadComponent: () => import('./buildings/buildings').then(m => m.Buildings)
            }
        ]
    },

    {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then(m => m.Login)
    },
    
    {
        path: 'register',
        loadComponent: () => import('./auth/register/register').then(m => m.Register)
    },

    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },

    {
        path: '**',
        redirectTo: '/home'
    }

];
