import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { LoginGuard } from './guards/login.guard';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { DummyRedirectComponent } from './pages/authentication/dummy-redirect/dummy-redirect.component';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/authentication/login',
        pathMatch: 'full',
      },
      {
        path: 'estadisticas',
        loadChildren: () =>
          import('./pages/estadisticas/statistics.routes').then(
            (m) => m.StatisticsRoutes
          ),
        canActivate: [RoleGuard],
        data: { role: ['SUBDIRECCION DE PLANEACIÓN Y VINCULACIÓN'] },
      },
      {
        path: 'captura',
        loadChildren: () =>
          import('./pages/captura/captura.routes').then(
            (m) => m.CapturaRoutes
          ),
        canActivate: [RoleGuard],
        data: { role: ['JEFE DE DEPARTAMENTO'] },
      },
      {
        path: 'indicadores',
        loadChildren: () =>
          import('./pages/indicadores/indicadores.routes').then(
            (m) => m.IndicadoresRoutes
          ),
        canActivate: [RoleGuard],
        // data: { role: [''] }, Si no se especifica el rol, permitirá el acceso solo al JEFE DE DEPARTAMENTO del DPPP
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./pages/reportes/reportes.routes').then(
            (m) => m.ReportesRoutes
          ),
        canActivate: [RoleGuard],
        // data: { role: [''] }, Si no se especifica el rol, permitirá el acceso solo al JEFE DE DEPARTAMENTO del DPPP
      },
      {
        path: 'change-password',
        component: ChangePasswordComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
  {
    path: 'auth/redirect',
    canActivate: [AuthGuard],
    component: DummyRedirectComponent,
  },

  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
        canActivate: [LoginGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
