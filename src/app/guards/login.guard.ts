import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';  

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      const isAuthenticated = await firstValueFrom(this.authService.isAuthenticated());
      if (isAuthenticated) {
        this.router.navigate(['/estadisticas']);
        return false;
      }
      return true;
    } catch (error) {
      return true;
    }
  }
}
