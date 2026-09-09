import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
    {
        path: 'app',
        canActivate: [authGuard],
        children: [
            {
                path: 'select-building',
                loadComponent: () => import('./select-building/select-building').then(m => m.SelectBuildingComponent),
            },
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
                path: 'announcements/create',
                loadComponent: () => import('./announcements/announcement-create/announcement-create').then(m => m.CreateAnnouncement)
            },
            {
                path: 'events',
                loadComponent: () => import('./events/events').then(m => m.Events)
            },
            {
                path: 'events/create',
                loadComponent: () => import('./events/event-create/event-create').then(m => m.CreateEvent)
            },
            {
                path: 'facilities',
                loadComponent: () => import('./facilities/facilities').then(m => m.Facilities)
            },
            {
                path: 'facilities/create',
                loadComponent: () => import('./facilities/facility-create/facility-create').then(m => m.CreateFacility)
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
            },
            {
                path: 'buildings/create',
                loadComponent: () => import('./buildings/area-create/area-create').then(m => m.CreateArea)
            },
            {
                path: 'area',
                loadComponent: () => import('./admin/admin-panel-layout/admin-panel-layout').then(m => m.AdminPanelLayout),
                canActivate: [adminGuard],
                children: [
                    {
                        path: 'admin-view',
                        loadComponent: () => import('./admin/admin-area-view/admin-area-view').then(m => m.AdminAreaView)
                    },
                    {
                        path: 'jobs',
                        loadComponent: () => import('./admin/admin-jobs-view/admin-jobs-view').then(m => m.AdminJobsView)
                    },
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'admin-view'
                    }
                ]
            }
        ]
    },
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
        redirectTo: '/app/home',
        pathMatch: 'full'
    },

    {
        path: '**',
        redirectTo: '/app/home'
    }

];
