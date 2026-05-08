import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
    <a [routerLink]="['/estadisticas']">
      <img
        [src]="isDarkTheme ? './assets/images/logos/logo-dark.svg' : './assets/images/logos/logo.svg'"
        class="cintilla"
        alt="logo"
      />
    </a>
  `,
  styles: [`
    .cintilla {
      width: 13rem;
      height: auto;
    }
  `]
})
export class BrandingComponent {
  options = this.settings.getOptions();

  isDarkTheme = false;
  private themeSubscription = Subscription.EMPTY;
  constructor(private settings: CoreService, private themeService: ThemeService) {
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDarkTheme = isDark
    );
  }

  ngOnDestroy() {
    this.themeSubscription.unsubscribe();
  }
}
