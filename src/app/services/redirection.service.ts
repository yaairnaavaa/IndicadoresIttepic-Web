import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeService } from './employee.service';

@Injectable({ providedIn: 'root' })
export class RedirectionService {
  constructor(private router: Router, private employeeService: EmployeeService) {}

  redirectUserByRole(): void {
    const role = this.employeeService.getEmployeeRole();
    const dept = this.employeeService.getEmployeeDepartment();

    if (
      role === 'JEFE DE DEPARTAMENTO' &&
      dept === 'DEPARTAMENTO DE PLANEACIÓN, PROGRAMACIÓN Y PRESUPUESTACIÓN'
    ) {
      this.router.navigateByUrl('/estadisticas');
    } else {
      switch (role) {
        case 'JEFE DE DEPARTAMENTO':
          this.router.navigateByUrl('/captura/pendientes');
          break;
        case 'SUBDIRECCION DE PLANEACIÓN Y VINCULACIÓN':
          this.router.navigateByUrl('/estadisticas');
          break;
        default:
          this.router.navigateByUrl('/authentication/login');
          break;
      }
    }
  }
}
