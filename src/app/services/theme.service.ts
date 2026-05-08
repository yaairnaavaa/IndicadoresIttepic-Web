import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'theme';
  private readonly DEFAULT_THEME = false; // false = light, true = dark

  // BehaviorSubject para mantener el estado actual del tema
  private isDarkThemeSubject = new BehaviorSubject<boolean>(this.DEFAULT_THEME);
  
  // Observable público para que los componentes se suscriban
  public isDarkTheme$: Observable<boolean> = this.isDarkThemeSubject.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private overlayContainer: OverlayContainer
  ) {
    this.loadThemeFromStorage();
    // Aplicar tema inicial al overlay container
    this.applyThemeToOverlay(this.getCurrentTheme());
  }

  getCurrentTheme(): boolean {
    return this.isDarkThemeSubject.value;
  }

  setTheme(isDark: boolean): void {
    this.isDarkThemeSubject.next(isDark);
    this.saveThemeToStorage(isDark);
    this.applyThemeToOverlay(isDark);
    this.applyThemeToBody(isDark);
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    this.setTheme(!currentTheme);
  }

  getThemeClass(): string {
    const isDark = this.getCurrentTheme();
    return `blue_theme ${isDark ? 'dark-theme' : 'light-theme'}`;
  }

  /**
   * Aplica las clases de tema al cdk-overlay-container
   */
  private applyThemeToOverlay(isDark: boolean): void {
    const overlayContainerElement = this.overlayContainer.getContainerElement();
    
    // Remover clases anteriores
    overlayContainerElement.classList.remove('light-theme', 'dark-theme', 'blue_theme');
    
    // Aplicar nuevas clases
    overlayContainerElement.classList.add('blue_theme');
    overlayContainerElement.classList.add(isDark ? 'dark-theme' : 'light-theme');
  }

  /**
   * Aplica las clases de tema al body del documento
   */
  private applyThemeToBody(isDark: boolean): void {
    const body = this.document.body;
    
    // Remover clases anteriores
    body.classList.remove('light-theme', 'dark-theme', 'blue_theme');
    
    // Aplicar nuevas clases
    body.classList.add('blue_theme');
    body.classList.add(isDark ? 'dark-theme' : 'light-theme');
  }

  private saveThemeToStorage(isDark: boolean): void {
    try {
      localStorage.setItem(this.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.warn('No se pudo guardar el tema en localStorage:', error);
    }
  }

  private loadThemeFromStorage(): void {
    try {
      const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
      if (savedTheme) {
        const isDark = savedTheme === 'dark';
        this.isDarkThemeSubject.next(isDark);
        // Aplicar tema cargado inmediatamente
        this.applyThemeToOverlay(isDark);
        this.applyThemeToBody(isDark);
      } else {
        // Aplicar tema por defecto
        this.applyThemeToOverlay(this.DEFAULT_THEME);
        this.applyThemeToBody(this.DEFAULT_THEME);
      }
    } catch (error) {
      console.warn('No se pudo cargar el tema desde localStorage:', error);
      this.isDarkThemeSubject.next(this.DEFAULT_THEME);
      this.applyThemeToOverlay(this.DEFAULT_THEME);
      this.applyThemeToBody(this.DEFAULT_THEME);
    }
  }
}