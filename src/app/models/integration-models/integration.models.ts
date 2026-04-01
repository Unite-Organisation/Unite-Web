export interface ServerError {
  status: number;
  error: string;
  message: string;
}

export interface TokenResponse {
  accessToken: string;
}