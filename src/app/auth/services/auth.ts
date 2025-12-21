import { P } from '@angular/cdk/keycodes';
import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth-token';
const ROLE_CLAIM = 'role';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  constructor() {}

  public saveToken(token: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  private getDecodedToken(): any | null {
    const token = this.getToken()
    if(!token){
      return null;
    }

    try{
      const parts = token.split('.')
      if(parts.length !== 3){
        console.error('Invalid JWT format.');
        return null;
      }
      
      const payload = atob(parts[1]);
      return JSON.parse(payload);

    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  }

  public getUserRole(): string | null {
    const decodedToken = this.getDecodedToken();
    
    if (decodedToken && decodedToken[ROLE_CLAIM]) {
      return decodedToken[ROLE_CLAIM];
    }
    return null;
  }

  public hasRole(requiredRole: string): boolean {
    const userRole = this.getUserRole();
    if (!userRole) {
        return false;
    }

    return userRole === requiredRole;
  }

  public getCurrentUserId(): string | null {
    const decodedToken = this.getDecodedToken();
    
    if (decodedToken && decodedToken['sub']) {
      return decodedToken['sub'];
    }
    return null;
  }

}
