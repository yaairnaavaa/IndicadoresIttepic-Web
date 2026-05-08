import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { IndicatorDataService } from 'src/app/services/indicator-data.service';
import { IndicatorData } from 'src/app/models/indicator-data.model';
import { ReportPeriodService } from 'src/app/services/reportPeriod.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReportPeriod } from 'src/app/models/reportPeriod.model';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmployeeService } from 'src/app/services/employee.service';
@Component({
  selector: 'app-capture-indicators',
  templateUrl: './capture-indicators.component.html',
  styleUrl: './capture-indicators.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 })),
      ]),
    ])
  ]
})
export class CaptureIndicatorsComponent implements OnInit {
  form: FormGroup;
  reportPeriods: ReportPeriod[] = [];
  indicators: IndicatorDefinition[] = [];
  uncapturedIndicators: IndicatorDefinition[] = [];
  selectedReportPeriodId: string | null = null;
  selectedReportPeriodIndex: number = -1;
  selectedIndicatorIndex: number = 0;
  loading = true;
  departmentId = this.employeeService.getEmployeeDepartmentId();
  capturedData: IndicatorData[] = [];

  constructor(
    private fb: FormBuilder,
    private reportPeriodService: ReportPeriodService,
    private dataService: IndicatorDataService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private employeeService: EmployeeService
  ) {
    this.form = this.fb.group({
      data: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadReportPeriods();
  }

  get dataArray(): FormArray {
    return this.form.get('data') as FormArray;
  }
  get departmentIdControl(): FormControl {
    return this.selectedFormGroup.get('departmentId') as FormControl;
  }


  private loadReportPeriods(): void {
    const reportPeriods$ = this.isJefeEspecial()
      ? this.reportPeriodService.getAllNoExpired()
      : this.reportPeriodService.getAllNoExpiredByDepartment(this.departmentId);

    reportPeriods$.subscribe({
      next: (reportPeriods) => {
        const filteredPeriods = reportPeriods.filter(period =>
          period.reportId.indicators && period.reportId.indicators.length > 0
        );

        if (filteredPeriods.length > 0) {
          const requests = filteredPeriods.map(period => {
            return this.dataService.getByReportPeriod(period._id!).pipe(
              map(capturedData => {
                // For special heads, we need to check if any indicator has any department not captured
                const hasUncapturedIndicators = period.reportId.indicators.some(indicator => {
                  const capturedDeptsForIndicator = capturedData
                    .filter(data => data.definition._id === indicator._id)
                    .map(data => data.department._id);

                  // Check if any department for this indicator hasn't been captured
                  return indicator.departments.some(dept =>
                    !capturedDeptsForIndicator.includes(dept._id))
                });

                return { period, hasUncapturedIndicators };
              })
            );
          });

          forkJoin(requests).subscribe(results => {
            this.reportPeriods = results
              .filter(result => result.hasUncapturedIndicators)
              .map(result => result.period);

            this.loading = false;

            if (this.reportPeriods.length > 0) {
              this.onReportPeriodSelect(0, new MouseEvent(''));
            }
          });
        } else {
          this.reportPeriods = [];
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Error al cargar períodos de captura', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      }
    });
  }


  onReportPeriodSelect(index: number, event?: MouseEvent): void {
    this.selectedReportPeriodIndex = index;
    this.selectedReportPeriodId = this.reportPeriods[index]._id!;

    const dataRequest = this.isJefeEspecial()
      ? this.dataService.getByReportPeriod(this.selectedReportPeriodId)
      : this.dataService.getByReportPeriodAndDepartment(this.selectedReportPeriodId, this.departmentId);

    dataRequest.subscribe({
      next: (capturedData) => {
        this.capturedData = capturedData;
        const allIndicators = this.reportPeriods[index].reportId.indicators;

        if (this.isJefeEspecial()) {
          // Para jefes especiales, un indicador no capturado es aquel que no tiene datos para ALGUNO de sus departamentos
          this.uncapturedIndicators = allIndicators.filter(indicator => {
            const capturedDeptsForIndicator = capturedData
              .filter(data => data.definition._id === indicator._id)
              .map(data => data.department._id);

            // El indicador está pendiente si hay al menos un departamento sin captura
            return indicator.departments.some(dept =>
              !capturedDeptsForIndicator.includes(dept._id)
            );
          });
        } else {
          // Para usuarios normales, mantener la lógica actual
          const capturedIndicatorIds = capturedData.map(data => data.definition._id);
          this.uncapturedIndicators = allIndicators.filter(
            indicator => !capturedIndicatorIds.includes(indicator._id)
          );
        }

        this.indicators = this.uncapturedIndicators;
        this.buildForm(this.indicators);
        this.selectedIndicatorIndex = 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.indicators = this.reportPeriods[index].reportId.indicators;
        this.buildForm(this.indicators);
        this.selectedIndicatorIndex = 0;
      }
    });
  }

  private buildForm(indicators: any[]): void {
    const controls = indicators.map((indicator) =>
      this.fb.group({
        indicatorDefinitionId: [indicator._id],
        value: [null, Validators.required],
        observation: [''],
        departmentId: [null],
      })
    );
    this.dataArray.clear();
    controls.forEach((ctrl) => this.dataArray.push(ctrl));
  }

  onIndicatorSelect(index: number, event: MouseEvent): void {
    this.selectedIndicatorIndex = index;
  }

  onSubmit(): void {
    if (!this.selectedReportPeriodId) return;

    const formValue = this.selectedFormGroup.value;

    let departmentId: string | null = null;

    if (this.isJefeEspecial()) {
      if (this.indicatorHasMultipleDepartments(this.selectedIndicatorIndex)) {
        departmentId = formValue.departmentId;
        if (!departmentId) {
          this.snackBar.open('Debes seleccionar un departamento', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          return;
        }
      } else {
        // significa que queda solo un departamento pendiente
        const pendingDepts = this.getDepartmentsForIndicator(this.selectedIndicatorIndex);
        departmentId = pendingDepts[0]._id;
      }
    } else {
      departmentId = this.employeeService.getEmployeeDepartmentId();
    }

    const data: IndicatorData = {
      definition: formValue.indicatorDefinitionId,
      reportPeriod: this.selectedReportPeriodId,
      department: departmentId!,
      value: formValue.value,
      comments: formValue.observation,
    };

    this.dataService.create(data).subscribe({
      next: (res) => {
        // 1) Mostrar notificación
        this.snackBar.open('Datos guardados correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });

        // 2) Actualizar localmente capturedData
        this.capturedData.push(res);

        // 3) Para jefeEspecial: eliminar sólo el depto capturado
        if (this.isJefeEspecial()) {
          const ind = this.indicators[this.selectedIndicatorIndex];
          // Filtramos el depto recién capturado
          ind.departments = ind.departments.filter(d => d._id !== departmentId);
          
          // Si no quedan deptos, quitamos el indicador entero
          if (this.getDepartmentsForIndicator(this.selectedIndicatorIndex).length === 0) {
            
            this.indicators.splice(this.selectedIndicatorIndex, 1);
          }
        } else {
          // 4) Para usuario normal: quitar indicador completo
          this.indicators.splice(this.selectedIndicatorIndex, 1);
        }

        // 5) Reconstruir el formulario con el nuevo arreglo
        this.buildForm(this.indicators);

        // 6) Calcular nuevo selectedIndicatorIndex
        if (this.indicators.length > 0) {
          // Si el índice actual se salió del rango, retrocedemos al último
          this.selectedIndicatorIndex = Math.min(
            this.selectedIndicatorIndex,
            this.indicators.length - 1
          );
        } else {
          // Ya no quedan indicadores: opcionalmente avanzar al siguiente periodo o desactivar vista
          this.selectedIndicatorIndex = 0;
          // Avanzar al siguiente periodo si existe
          if (this.selectedReportPeriodIndex < this.reportPeriods.length - 1) {
            this.onReportPeriodSelect(this.selectedReportPeriodIndex + 1);
          }

        }

        // 7) Refrescar Angular
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Ocurrió un error al guardar', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }


  isJefeEspecial(): boolean {
    const userRole = this.employeeService.getEmployeeRole();
    const userDept = this.employeeService.getEmployeeDepartment();

    return (
      userRole === 'JEFE DE DEPARTAMENTO' &&
      userDept === 'DEPARTAMENTO DE PLANEACIÓN, PROGRAMACIÓN Y PRESUPUESTACIÓN'
    );
  }

  indicatorHasMultipleDepartments(index: number): boolean {
    return this.getDepartmentsForIndicator(index).length > 1;
  }

  getDepartmentsForIndicator(index: number): any[] {
    const indicator = this.indicators[index];
    if (!this.isJefeEspecial() || !indicator.departments) return indicator.departments || [];

    // Para jefes especiales, filtramos los departamentos ya capturados
    const capturedDeptsForIndicator = this.capturedData
      .filter(data => data.definition._id === indicator._id)
      .map(data => data.department._id);

    return indicator.departments.filter(dept =>
      !capturedDeptsForIndicator.includes(dept._id)
    );
  }


  get selectedFormGroup(): FormGroup {
    return this.dataArray.at(this.selectedIndicatorIndex) as FormGroup;
  }
}