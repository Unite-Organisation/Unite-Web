import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: 'home',
        loadComponent: () => import('./home/home').then(m => m.Home)
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
