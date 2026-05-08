import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { IndicatorData } from 'src/app/models/indicator-data.model';

@Component({
  selector: 'app-indicator-details-dialog',
  imports: [CommonModule, MaterialModule],
  standalone: true,
  templateUrl: './indicator-details-dialog.component.html',
  styleUrl: './indicator-details-dialog.component.scss',
})
export class IndicatorDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: IndicatorData) { }

  getLatestChange() {
    if (!this.data?.changesLog?.length) return null;

    return this.data.changesLog.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
  }
  getUserGrade(grades: any[]): string {
    return grades?.length ? grades[0].abbreviation + ' ' : '';
  }
}
