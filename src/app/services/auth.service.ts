import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  username?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // Spring Boot backend URL
  private apiUrl = 'http://10.197.4.2:8181/api/auth';

  constructor(private http: HttpClient) {}

  // Signup — data database mein jayega (BCrypt encrypted password)
  signup(data: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data);
  }

  // Login — activity bhi database mein store hogi
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  saveToken(token: string): void {
    localStorage.setItem('eoffice_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('eoffice_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('eoffice_token');
    localStorage.removeItem('eoffice_user');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('eoffice_user');
    return user ? JSON.parse(user) : null;
  }
}
