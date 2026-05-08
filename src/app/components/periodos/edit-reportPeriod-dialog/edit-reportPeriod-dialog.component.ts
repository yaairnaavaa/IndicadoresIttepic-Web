import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Report } from 'src/app/models/report.model';
import { ReportPeriod } from 'src/app/models/reportPeriod.model';
import { ReportService } from 'src/app/services/report.service';
import { ReportDetailsDialogComponent } from '../../reportes/report-details-dialog/report-details-dialog.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  selector: 'app-edit-reportPeriod-dialog',
  templateUrl: './edit-reportPeriod-dialog.component.html',
  styleUrl: './edit-reportPeriod-dialog.component.scss',
})
export class EditReportPeriodDialogComponent {
  reports: Report[] = [];
  selectedReportId: string | null = null;
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<EditReportPeriodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reportPeriod: ReportPeriod },
  ) {

    this.editForm = this.fb.group({
      reportId: [data.reportPeriod.reportId._id, Validators.required],
      semester: [data.reportPeriod.semester, Validators.required],
      year: [data.reportPeriod.year, [Validators.required, Validators.min(1975)]],
      startDate: [data.reportPeriod.startDate, Validators.required],
      endDate: [data.reportPeriod.endDate, Validators.required],
      dueDate: [data.reportPeriod.dueDate, Validators.required],
      isActive: [data.reportPeriod.isActive],
    });

    if (data.reportPeriod.reportId) {
      this.selectedReportId = data.reportPeriod.reportId._id!;
      this.editForm.patchValue({ reportId: this.selectedReportId });
    }
  }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportService.getAll().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.editForm.patchValue({ reportId: this.selectedReportId });
        error: () => {
          this.snackBar.open('Error al cargar los reportes', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      }
    });
  }

  selectReport(reportId: string): void {
    this.selectedReportId = reportId;
    this.editForm.patchValue({ reportId: reportId });
  }

  onSave(): void {
    if (this.editForm.invalid) return;

    const { reportId, ...rest } = this.editForm.value;
    let dueDate = this.editForm.get('dueDate')?.value;
    if (dueDate) {
      if (!(dueDate instanceof Date)) {
        dueDate = new Date(dueDate);
      }

      dueDate.setHours(23, 59, 0, 0);
      this.editForm.patchValue({ dueDate: dueDate });
    }
    const updatedReport: Report = {
      ...rest,
      _id: this.data.reportPeriod._id,
      reportId: reportId,
      updatedAt: new Date()
    };

    this.dialogRef.close(updatedReport);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}