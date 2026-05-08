import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReportService } from 'src/app/services/report.service';
import { Report } from 'src/app/models/report.model';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { ReportDetailsDialogComponent } from 'src/app/components/reportes/report-details-dialog/report-details-dialog.component';
import { EditReportDialogComponent } from '../edit-report-dialog/edit-report-dialog.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-carrousel-reports-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatSnackBarModule,
    FormsModule,
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
  styleUrl: './carrousel-reports.component.scss',
  templateUrl: './carrousel-reports.component.html',
})
export class CarrouselReportsComponent implements OnInit {
  reports: Report[] = [];
  filteredReports: Report[] = [];
  selectedReportId: string | null = null;
  searchTerm: string = '';

  @Output() createAction = new EventEmitter<void>();
  
  constructor(
    private reportService: ReportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportService.getAll().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.filteredReports = [...this.reports];
        error: () => {
          this.snackBar.open('Error al cargar los reportes', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      }
    });
  }

  filterReports(): void {
    if (!this.searchTerm) {
      this.filteredReports = [...this.reports];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredReports = this.reports.filter(report => 
      report.name.toLowerCase().includes(term))
  }

  selectReport(reportId: string): void {
    this.selectedReportId = reportId;
  }

  openDetailsDialog(_reportId: string): void {
    this.dialog.open(ReportDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: this.reports.find(report => report._id === _reportId),
    });
  }

  editReport(report: Report): void {
    window.scrollTo({ top: 0 });
    const dialogRef = this.dialog.open(EditReportDialogComponent, {
      width: '70vw',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { report },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(updatedReport => {
      if (updatedReport) {
        this.reportService.update(updatedReport._id, updatedReport).subscribe({
          next: () => {
            this.loadReports();
            this.snackBar.open('Reporte actualizado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: (error) => {
            this.snackBar.open('Error al actualizar el reporte', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }
        });
      }
    });
  }

  onCreate(): void {
    this.createAction.emit();
  }
}