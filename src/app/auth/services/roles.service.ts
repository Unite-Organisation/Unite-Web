import { inject, Injectable } from "@angular/core";
import { AuthService } from "./auth";
import {AppRoles } from "../commons/app.roles";

@Injectable({
    providedIn: 'root',
})
export class RolesService {
    private readonly authService = inject(AuthService);

    isResident(): boolean {
        return this.authService.hasRole(AppRoles.RESIDENT)
    }

    isManager(): boolean {
        return this.authService.hasRole(AppRoles.MANAGER)
    }

    isAdmin(): boolean {
        return this.authService.hasRole(AppRoles.ADMIN)
    }

}