import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth-token';
const ROLE_CLAIM = 'role';
const USER_META_INFO_KEY = 'user-meta-info';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  private accessToken: string | null = null;

  constructor() {}

  public saveToken(token: string): void {
   this.accessToken = token;
  }

  public getToken(): string | null {
    return this.accessToken;
  }

  public isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  public logout(): void {
    this.accessToken = null;
    localStorage.removeItem(USER_META_INFO_KEY);
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
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;

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
