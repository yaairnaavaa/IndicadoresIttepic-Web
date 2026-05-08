import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ReportPeriod } from 'src/app/models/reportPeriod.model';
import { ReportPeriodService } from 'src/app/services/reportPeriod.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditReportPeriodDialogComponent } from '../../edit-reportPeriod-dialog/edit-reportPeriod-dialog.component';
import { NgIf } from '@angular/common';
import { ReportPeriodsPresenterComponent } from '../presenter(dump)/report-periods-presenter.component';
import { MatSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-report-periods-container',
  imports: [
    NgIf,
    ReportPeriodsPresenterComponent,
    MatSpinner
  ],
  template: `
  <div *ngIf="!isLoading; else loadingState">
    <app-report-periods-presenter [data]="reportPeriods"
      [error]="error" (edit)="handleEdit($event)"
      (create)="handleCreate()">
    </app-report-periods-presenter>

  </div>

  <ng-template #loadingState>
    <div class="loading-state">
      <mat-spinner diameter="50"></mat-spinner>
      <h3>Cargando períodos de captura...</h3>
    </div>
  </ng-template>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      gap: 16px;
      
      h3 {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-weight: 500;
      }
    }
  `]
})
export class ReportPeriodsContainerComponent implements OnInit {
  reportPeriods: ReportPeriod[] = [];
  isLoading = true;
  error: string | null = null;


  @Output() createAction = new EventEmitter<void>();

  constructor(
    private reportPeriodService: ReportPeriodService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadReportPeriods();
  }

  loadReportPeriods() {
    this.isLoading = true;
    this.error = null;

    this.reportPeriodService.getAll().subscribe({
      next: (data: ReportPeriod[]) => {
        this.reportPeriods = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los períodos de reporte';
        this.isLoading = false;
        this.snackBar.open(this.error, 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  handleEdit(reportPeriod: ReportPeriod) {
    const dialogRef = this.dialog.open(EditReportPeriodDialogComponent, {
      width: '70vw',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { reportPeriod },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(updatedReportPeriod => {
      if (updatedReportPeriod) {
        this.reportPeriodService.update(updatedReportPeriod._id, updatedReportPeriod).subscribe({
          next: () => {
            this.loadReportPeriods();
            this.snackBar.open('Período actualizado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: () => {
            this.snackBar.open('Error al actualizar el período', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }
        });
      }
    });
  }

  handleCreate() {
    this.createAction.emit();
  }

}