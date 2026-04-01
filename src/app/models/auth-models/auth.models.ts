export interface UserLoginRequest {
  username: string; 
  password: string;
}

export interface UserRegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
}