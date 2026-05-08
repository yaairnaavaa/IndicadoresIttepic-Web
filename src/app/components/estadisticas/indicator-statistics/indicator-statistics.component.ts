import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService } from "src/app/services/statistics.service";
import { IndicatorDataReport } from "src/app/models/indicator-data.model";
import { finalize } from 'rxjs/operators';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MaterialModule } from "src/app/material.module";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { SharedFiltersService } from 'src/app/services/shared-filters.service';
import { Subscription } from 'rxjs';
import { IndicatorChartComponent, ChartIndicator } from "./indicator-chart/indicator-chart.component";
import { IndicatorComparisonChartComponent } from "./indicator-comparison-chart/indicator-comparison-chart.component";
import { trigger, state, style, transition, animate } from "@angular/animations";

@Component({
  selector: "app-indicator-statistics",
  imports: [
    IndicatorChartComponent,
    IndicatorComparisonChartComponent,
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatTableModule,
    MatPaginatorModule,
    MaterialModule
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  templateUrl: "./indicator-statistics.component.html",
  styleUrls: ["./indicator-statistics.component.scss"],
  standalone: true,
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        overflow: 'hidden',
        opacity: '0'
      })),
      state('expanded', style({
        height: '*',
        overflow: 'hidden',
        opacity: '1'
      })),
      transition('expanded <=> collapsed', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class AppIndicatorStatisticsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['select', 'key', 'name', 'department', 'report'];
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 100];

  // Filtrado de indicadores de la tabla
  searchTerm: string = '';

  // Toggle para modo comparación
  comparisonMode: boolean = false;

  // Toggle para colapso de seccion
  isMinimized = false;

  // Filtros (ahora manejados por el servicio compartido)
  private filtersSubscription: Subscription;
  currentFilters: any = {};

  allIndicators: ChartIndicator[] = [];
  filteredIndicators: ChartIndicator[] = [];
  isLoading: boolean = true;
  reportData: IndicatorDataReport[] = [];
  errorMessage: string | null = null;
  noDataAvailable: boolean = false;

  private _cachedVisibleIndicators: ChartIndicator[] = [];
  private _lastFilteredIndicatorsHash: string = '';

  constructor(
    private statisticsService: StatisticsService,
    private sharedFiltersService: SharedFiltersService
  ) { }

  ngOnInit() {
    this.subscribeToFilters();
  }

  ngOnDestroy() {
    if (this.filtersSubscription) {
      this.filtersSubscription.unsubscribe();
    }
  }

  private subscribeToFilters() {
    this.filtersSubscription = this.sharedFiltersService.currentFilters.subscribe(filters => {
      this.currentFilters = filters;
      this.loadReportData(filters);
    });
  }

  private loadReportData(filters: any) {
    this.errorMessage = null;
    this.isLoading = true;
    this.noDataAvailable = false;

    this.statisticsService.getStatisticsIndicatorData(
      filters.periodIds || [],
      filters.departmentIds || [],
      filters.semesters || [],
      filters.years ? filters.years.map((y: string) => +y) : [],
      filters.startDate,
      filters.endDate
    )
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.reportData = data;
          this.noDataAvailable = data.length === 0;
          this.initializeIndicators();
        },
        error: () => {
          this.errorMessage = 'Error al cargar los datos del gráfico';
        }
      });
  }

  private initializeIndicators() {
    this.allIndicators = this.reportData.map(item => ({
      id: item._id,
      key: item.definition.key,
      name: item.definition.name,
      report: `${item.reportPeriod.reportId.name} - ${item.reportPeriod.semester}${item.reportPeriod.year}`,
      department: item.department.name,
      visible: true
    }));

    this.filteredIndicators = [...this.allIndicators];
  }

  updateFilteredIndicators() {
    this.filteredIndicators = this.allIndicators.filter(indicator => {
      // Filtro por clave o nombre
      const matchesSearch =
        indicator.key.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        indicator.name.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesSearch;
    });

    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  get paginatedIndicators() {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredIndicators.slice(startIndex, startIndex + this.pageSize);
  }

  get visibleIndicators(): ChartIndicator[] {
    const currentHash = this.generateIndicatorsHash();

    if (currentHash !== this._lastFilteredIndicatorsHash) {
      this._cachedVisibleIndicators = this.filteredIndicators.filter(ind => ind.visible);
      this._lastFilteredIndicatorsHash = currentHash;
    }

    return this._cachedVisibleIndicators;
  }

  private generateIndicatorsHash(): string {
    return this.filteredIndicators
      .map(ind => `${ind.id}-${ind.visible}`)
      .join('|');
  }

  // Método para invalidar cache cuando sea necesario
  private invalidateVisibleIndicatorsCache(): void {
    this._lastFilteredIndicatorsHash = '';
  }

  isSelected(indicator: ChartIndicator): boolean {
    return indicator.visible;
  }

  toggleSelection(indicator: ChartIndicator): void {
    indicator.visible = !indicator.visible;
  }

  allSelected(): boolean {
    return this.filteredIndicators.length > 0 &&
      this.filteredIndicators.every(ind => ind.visible);
  }

  toggleAllRows(): void {
    const allSelected = this.allSelected();
    this.filteredIndicators.forEach(indicator => {
      indicator.visible = !allSelected;
    });
    this.invalidateVisibleIndicatorsCache();
    this.updateFilteredIndicators();
  }

  someSelected(): boolean {
    const hasSelected = this.paginatedIndicators.some(ind => ind.visible);
    const hasUnselected = this.paginatedIndicators.some(ind => !ind.visible);

    return hasSelected && hasUnselected;
  }

  // Método para manejar click específico en checkbox
  handleCheckboxClick(indicator: ChartIndicator, event: Event): void {
    event.stopPropagation();
    this.invalidateVisibleIndicatorsCache();
    this.updateFilteredIndicators();
  }

  // Método para manejar click específico en rows
  handleRowClick(row: ChartIndicator, event: MouseEvent): void {
    if ((event.target as HTMLElement).tagName.toLowerCase() !== 'mat-checkbox') {
      this.toggleSelection(row);
      this.invalidateVisibleIndicatorsCache();
      this.updateFilteredIndicators();
    }
  }

  // Toggle para modo comparación
  toggleComparisonMode(): void {
    this.comparisonMode = !this.comparisonMode;
  }

  // Toggle para colapso de seccion
  toggleMinimized(): void {
    this.isMinimized = !this.isMinimized;
  }
}