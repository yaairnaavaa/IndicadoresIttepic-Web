import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { RedirectionService } from '../services/redirection.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private router: Router,
    private redirectionService: RedirectionService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    try {
      const isAuthenticated = await firstValueFrom(this.authService.isAuthenticated());
      if (!isAuthenticated) return this.router.parseUrl('/authentication/login');

      const expectedRoles: string[] = route.data['role'] || [];
      const userRole = this.employeeService.getEmployeeRole();
      const userDept = this.employeeService.getEmployeeDepartment();

      const isJefeEspecial =
        userRole === 'JEFE DE DEPARTAMENTO' &&
        userDept === 'DEPARTAMENTO DE PLANEACIÓN, PROGRAMACIÓN Y PRESUPUESTACIÓN';

      if (expectedRoles.includes(userRole) || isJefeEspecial) {
        return true;
      }

      this.redirectionService.redirectUserByRole();
      return false;

    } catch (error) {
      return this.router.parseUrl('/authentication/login');
    }
  }
}
