import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ReportService } from 'src/app/services/report.service';
import { ReportPeriodService } from 'src/app/services/reportPeriod.service';
import { Report } from 'src/app/models/report.model';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { Router } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { ReportDetailsDialogComponent } from 'src/app/components/reportes/report-details-dialog/report-details-dialog.component';

@Component({
  selector: 'app-create-period-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatSnackBarModule,
    MatDatepickerModule,
  ],
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
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  styleUrl: './create-period.component.scss',
  templateUrl: './create-period.component.html',
})
export class CreatePeriodComponent implements OnInit {
  form: FormGroup;
  reports: Report[] = [];
  selectedReportId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private reportPeriodService: ReportPeriodService,
    private reportService: ReportService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      reportId: [null, Validators.required],
      semester: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1975)]],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required],
      dueDate: [new Date(), Validators.required],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportService.getAll().subscribe({
      next: (reports) => {
        this.reports = reports;
        error: () => {
          this.snackBar.open('Error al cargar los reportes', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      }
    });
  }

  onCreateReport(): void {
    this.router.navigate(['reportes/crear']);
  }

  selectReport(reportId: string): void {
    this.selectedReportId = reportId;
    this.form.patchValue({ reportId: reportId });
  }

  onSubmit() {
    if (this.form.invalid) return;
    
    const dueDate = this.form.get('dueDate')?.value as Date;

    if (dueDate) {
      dueDate.setHours(23);
      dueDate.setMinutes(59);
      dueDate.setSeconds(0);
      dueDate.setMilliseconds(0);

      // Actualizar el valor en el formulario
      this.form.patchValue({ dueDate: dueDate });
    }
    this.reportPeriodService.create(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Período de captura creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/reportes/ver']);
      },
      error: (error) => {
        const errorMessage = error.error?.message ||
          error.error?.error ||
          'Error al crear el período de captura';

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  openDetailsDialog(_reportId: string): void {
    this.dialog.open(ReportDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: this.reports.find(report => report._id === _reportId),
    });
  }
}
