import { Routes } from '@angular/router';
import { CreateReportComponent } from './crear/create-report.component';
import { CreatePeriodComponent } from './periodo/create-period.component';
import { ViewReportsComponent } from './ver/view-reports.component';

export const ReportesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'crear',
        component: CreateReportComponent,
      },
      {
        path: 'periodo',
        component: CreatePeriodComponent,
      },
      {
        path: 'ver',
        component: ViewReportsComponent,
      },
    ],
  },
];
