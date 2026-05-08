import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/services/theme.service';


@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: [],
  imports: [RouterOutlet, MaterialModule, CommonModule],
})
export class BlankComponent {
  private htmlElement!: HTMLHtmlElement;

  options = this.settings.getOptions();
  isDarkTheme = false;
  private themeSubscription = Subscription.EMPTY;

  constructor(private settings: CoreService, private themeService: ThemeService) {
    this.htmlElement = document.querySelector('html')!;
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDarkTheme = isDark
    );
  }

  ngOnDestroy() {
    this.themeSubscription.unsubscribe();
  }

  getThemeClass(): string {
    return this.themeService.getThemeClass();
  }
}
