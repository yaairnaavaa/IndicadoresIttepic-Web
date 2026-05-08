import { Routes } from '@angular/router';
import { CaptureIndicatorsComponent } from './capturar/capture-indicators.component';
import { CapturedIndicatorsContainerComponent } from './capturados/container(smart)/captured-indicators-container.component';

export const CapturaRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'pendientes',
        component: CaptureIndicatorsComponent,
      },
      {
        path: 'capturados',
        component: CapturedIndicatorsContainerComponent,
      }
    ],
  },
];
