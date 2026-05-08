import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private readonly REMEMBER_ME_KEY = 'rememberedEmail';

  private userLoaded = false;
  private currentUserSubject = new BehaviorSubject<any | null>(null);

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) { }

  private loginUrl = `${this.apiUrl}/login`;
  private logoutUrl = `${this.apiUrl}/logout`;
  private checkSession = `${this.apiUrl}/me`;
  private changePasswordUrl = `${this.apiUrl}/change/password`;

  // Método para obtener el email recordado
  getRememberedEmail(): string | null {
    return localStorage.getItem(this.REMEMBER_ME_KEY);
  }

  // Método para limpiar el email recordado
  clearRememberedEmail(): void {
    localStorage.removeItem(this.REMEMBER_ME_KEY);
  }

  login(credentials: { email: string; password: string; rememberMe: boolean }) {
    return this.http.post(this.loginUrl, credentials, {
      withCredentials: true,
    }).pipe(
      tap((response: any) => {
        if (response.user) {
          this.userService.setUser(response.user);
          this.currentUserSubject.next(response.user);
          this.userLoaded = true;
          
          // Guardar el email si rememberMe está activado
          if (credentials.rememberMe) {
            localStorage.setItem(this.REMEMBER_ME_KEY, credentials.email);
          } else {
            this.clearRememberedEmail();
          }
        }
      })
    );
  }

  logout() {
    return this.http.post(this.logoutUrl, {}, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        this.userService.clearUser();
        this.currentUserSubject.next(null);
        this.userLoaded = false;
        this.clearRememberedEmail(); // Limpiar el email al hacer logout
      })
    );
  }

  /** Llama a /users/me solo una vez */
  getCurrentUser(): Observable<any | null> {
    if (this.userLoaded) {
      return this.currentUserSubject.asObservable();
    }

    return this.http.get(this.checkSession, { withCredentials: true }).pipe(
      tap((response: any) => {
        if (response.user) {
          this.userService.setUser(response.user);
          this.currentUserSubject.next(response.user);
        } else {
          this.currentUserSubject.next(null);
        }
        this.userLoaded = true;
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        this.userLoaded = true;
        return of(null);
      }),
      map(() => this.currentUserSubject.value)
    );
  }

  /** Devuelve true si hay usuario */
  isAuthenticated(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => !!user)
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    const body = { currentPassword, newPassword };
    return this.http.post(this.changePasswordUrl, body, { withCredentials: true });
  }
}