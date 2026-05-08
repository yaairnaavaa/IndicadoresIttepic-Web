import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { ThemeService } from 'src/app/services/theme.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
    MatBadgeModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnDestroy {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();

  isDarkTheme = false;
  user: any;
  private themeSubscription = Subscription.EMPTY;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private http: HttpClient,
    private themeService: ThemeService
  ) {
    this.userService.currentUser$.subscribe(user => {
      this.user = user;
    });

    // Suscribirse a los cambios de tema
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDarkTheme = isDark
    );
  }

  ngOnDestroy() {
    this.themeSubscription.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getInitials(): string {
    if (!this.user?.name?.fullName) return 'U'; // 'U' como fallback para Usuario

    const names = this.user.name.fullName.split(' ').filter((name: string) => name.length > 0);

    // Si solo hay una palabra, devolver su primera letra
    if (names.length === 1) {
      return names[0].substring(0, 1).toUpperCase();
    }

    // Tomar primera letra del primer nombre
    let initials = names[0].substring(0, 1).toUpperCase();

    // Tomar primera letra de la penúltima palabra si hay al menos 2 palabras
    if (names.length >= 2) {
      const penultimateIndex = names.length - 2;
      initials += names[penultimateIndex].substring(0, 1).toUpperCase();
    }

    return initials;
  }

  downloadPlantillaExcel(): void {
    const filePath = 'assets/plantilla/plantilla-indicadores.xlsx';

    this.http.get(filePath, { responseType: 'blob' }).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla-indicadores.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: (response) => {
        this.router.navigate(['/authentication/login']);
      },
      error: (error) => {
        // console.error('Error en el logout', error);
      }
    });
  }
}