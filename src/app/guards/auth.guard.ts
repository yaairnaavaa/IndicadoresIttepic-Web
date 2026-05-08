import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';  

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      const isAuthenticated = await firstValueFrom(this.authService.isAuthenticated());
      if (isAuthenticated) {
        return true;
      } else {
        this.router.navigate(['/authentication/login']);
        return false;
      }
    } catch (error) {
      this.router.navigate(['/authentication/login']);
      return false;
    }
  }
  
}
