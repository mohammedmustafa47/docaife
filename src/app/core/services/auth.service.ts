import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = environment.local_url;

  private authState = new BehaviorSubject<boolean>(this.hasToken());
  authState$ = this.authState.asObservable();

  private profileSubject = new BehaviorSubject<any>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient) {

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        const profile = parsed.data || parsed;
        this.profileSubject.next(profile);
      } catch (error) {
        console.error('Error parsing saved profile:', error);
        localStorage.removeItem('userProfile');
      }
    }
  }


  // ==========================
  // LOGIN
  // ==========================

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/authapi/login/`, credentials)
      .pipe(
        tap(res => {
          this.storeTokens(res.data.access_token, res.data.refresh_token);
          this.authState.next(true);
        }),
        catchError(this.handleError)
      );
  }

  // ==========================
  // REGISTER
  // ==========================

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/authapi/register/`, data)
      .pipe(catchError(this.handleError));
  }

  // ==========================
  // PROFILE
  // ==========================

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/authapi/profile/`)
      .pipe(
        tap(response => {
          const profile = (response as any).data || response;
          this.profileSubject.next(profile);
          localStorage.setItem('userProfile', JSON.stringify(profile));
        }),
        catchError(this.handleError)
      );
  }

  getCurrentProfile(): any {
    return this.profileSubject.value;
  }

  // ==========================
  // LOGOUT
  // ==========================

  logout(): Observable<any> {
    const refresh = this.getRefreshToken();

    return this.http.post(`${this.baseUrl}/authapi/logout/`, {
      refresh_token: refresh
    }).pipe(
      tap(() => {
        this.profileSubject.next(null);
        localStorage.removeItem('userProfile');
        this.clearStorage();
        this.authState.next(false);
      }),
      catchError(this.handleError)
    );
  }

  // ==========================
  // REFRESH TOKEN
  // ==========================

  refreshToken(): Observable<any> {
    const refresh = this.getRefreshToken();

    return this.http.post<any>(
      `${this.baseUrl}/api/token/refresh/`,
      { refresh }
    );
  }

  // ==========================
  // TOKEN STORAGE
  // ==========================

  private storeTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  // ==========================
  // GLOBAL ERROR HANDLER
  // ==========================

  private handleError(error: HttpErrorResponse) {

    let message = 'Something went wrong';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Server not reachable';
    }

    return throwError(() => ({
      status: error.status,
      message
    }));
  }
}