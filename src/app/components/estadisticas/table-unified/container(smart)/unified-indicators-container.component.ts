import { Component } from '@angular/core';
import { StatisticsService } from 'src/app/services/statistics.service';
import { IndicatorDataUnified } from 'src/app/models/indicator-data.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppTableUnifiedComponent } from '../presenter(dump)/table-unified.component';

@Component({
  selector: 'app-unified-indicators-container',
  imports:[AppTableUnifiedComponent],
  template: `
    <app-unified-indicators-table 
      [data]="indicators">
    </app-unified-indicators-table>
  `,
})
export class UnifiedIndicatorsContainerComponent {
  indicators: IndicatorDataUnified[] = [];

  constructor(
    private statisticsService: StatisticsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadIndicators();
  }

  private loadIndicators(): void {
    this.statisticsService.getIndicatorsWithData().subscribe({
      next: (data) => {
        this.indicators = data.map((item, idx) => ({ ...item, index: idx + 1 }));
      },
      error: () => {
        this.snackBar.open('Error al cargar indicadores', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

}