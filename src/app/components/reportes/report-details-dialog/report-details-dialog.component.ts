import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { Report } from 'src/app/models/report.model';
import { IndicatorTableComponent } from '../../indicadores/indicators-table/indicators-table.component';

@Component({
  selector: 'app-report-details-dialog',
  imports: [CommonModule, MaterialModule, IndicatorTableComponent],
  standalone: true,
  templateUrl: './report-details-dialog.component.html',
  styleUrl: './report-details-dialog.component.scss',
})
export class ReportDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Report) { }
  displayedColumns: string[] = ['key', 'name', 'departments', 'goal'];
  
}
