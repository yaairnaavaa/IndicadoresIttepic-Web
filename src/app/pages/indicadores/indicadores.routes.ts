import { Routes } from '@angular/router';
import { ViewIndicatorsComponent } from './ver/view-indicators.component';
import { CreateComponent } from './crear/create.component';

export const IndicadoresRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'ver',
        component: ViewIndicatorsComponent,
      },
      {
        path: 'crear',
        component: CreateComponent,
      },
      {
        path: 'editar/:id',
        component: CreateComponent,
      }
    ],
  },
];
