import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { CarrouselReportsComponent } from 'src/app/components/reportes/carrousel-reports/carrousel-reports.component';
import { Router } from '@angular/router';
import { ReportPeriodsContainerComponent } from 'src/app/components/periodos/table-reportPeriods/container(smart)/report-periods-container.component';

@Component({
  selector: 'app-view-reports-page',
  imports: [MaterialModule, CommonModule, CarrouselReportsComponent, ReportPeriodsContainerComponent],
  templateUrl: './view-reports.component.html',
})

export class ViewReportsComponent {

  constructor(
    private router: Router
  ) { }

  navigateToCreateReport(): void {
    this.router.navigate(['/reportes/crear']);
  }

  navigateToCreatePeriod(): void {
    this.router.navigate(['/reportes/periodo']);
  }
}
