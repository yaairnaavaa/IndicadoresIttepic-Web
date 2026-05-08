import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { StatsDashboardComponent } from 'src/app/components/estadisticas/stats-dashboard/stats-dashboard.component';
import { UnifiedIndicatorsContainerComponent } from 'src/app/components/estadisticas/table-unified/container(smart)/unified-indicators-container.component';
import { AppIndicatorStatisticsComponent } from 'src/app/components/estadisticas/indicator-statistics/indicator-statistics.component';

@Component({
  selector: 'app-statistics',
  imports: [
    MaterialModule,
    StatsDashboardComponent,
    UnifiedIndicatorsContainerComponent,
    AppIndicatorStatisticsComponent,
  ],
  templateUrl: './statistics.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class StatisticsComponent {}
