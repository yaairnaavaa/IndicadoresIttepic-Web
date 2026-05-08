import { Component, OnInit } from '@angular/core';
import { ReportPeriod } from 'src/app/models/reportPeriod.model';
import { ReportPeriodService } from 'src/app/services/reportPeriod.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CapturedIndicatorsComponent } from '../presenter(dump)/captured-indicators.component';
import { MaterialModule } from 'src/app/material.module';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-captured-indicators-container',
  imports: [
    CapturedIndicatorsComponent,
    MaterialModule,
    NgIf
  ],
  template: `
    <div *ngIf="!isLoading; else loadingState">
      <app-captured-indicators-table
        [data]="reportPeriods"
        [isJefeEspecial]="isJefeEspecial"
        [userDeptId]="userDeptId"
      ></app-captured-indicators-table>
    </div>
    <ng-template #loadingState>
      <div class="loading-state">
        <mat-spinner diameter="90"></mat-spinner>
        <h3>Cargando períodos de captura...</h3>
      </div>
    </ng-template>
  `,
  styles: `
    .loading-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
      gap: 16px;
      
      h3 {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-weight: 500;
      }
    }
  `
})
export class CapturedIndicatorsContainerComponent implements OnInit {
  reportPeriods: ReportPeriod[] = [];
  isLoading = true;
  isJefeEspecial = false;
  selectedReport: ReportPeriod | null = null;
  userDeptId = '';

  constructor(
    private reportPeriodService: ReportPeriodService,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadCapturedReports();
  }

  private checkUserRole(): void {
    const userRole = this.employeeService.getEmployeeRole();
    const userDept = this.employeeService.getEmployeeDepartment();
    this.userDeptId = this.employeeService.getEmployeeDepartmentId();

    this.isJefeEspecial =
      userRole === 'JEFE DE DEPARTAMENTO' &&
      userDept === 'DEPARTAMENTO DE PLANEACIÓN, PROGRAMACIÓN Y PRESUPUESTACIÓN';
  }

  private loadCapturedReports(): void {
    const data$ = this.isJefeEspecial
      ? this.reportPeriodService.getAllWithCapturedIndicators()
      : this.reportPeriodService.getAllWithCapturedIndicatorsByDepartment(this.userDeptId);

    data$.subscribe({
      next: (data: ReportPeriod[]) => {
        this.reportPeriods = data.map((item, idx) => ({ ...item, index: idx + 1 }));
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Error cargando reportes capturados', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.isLoading = false;
      }
    });
  }
}