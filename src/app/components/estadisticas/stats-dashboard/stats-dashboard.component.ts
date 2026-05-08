import { Component, OnInit } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { StatisticsService } from 'src/app/services/statistics.service';
import { IndicatorData } from 'src/app/models/indicator-data.model';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { IndicatorDetailsDialogComponent } from '../indicator-details-dialog/indicator-details-dialog.component';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexXAxis,
  ApexTooltip,
  ApexTheme,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { CaptureProgressResponse } from 'src/app/models/statistics.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SharedFiltersService } from 'src/app/services/shared-filters.service';
import { SharedFiltersComponent } from '../shared-filters/shared-filters.component';
import { DepartmentProgressDialogComponent } from '../department-progress-details-dialog/department-progress-dialog.component';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ThemeService } from 'src/app/services/theme.service';

type ChartOptions = {
  series: number[];
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: any;
  theme: ApexTheme;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  markers: any;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  labels: string[];
  responsive: any[];
};

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [MaterialModule, CommonModule, NgApexchartsModule, MatDatepickerModule, FormsModule, SharedFiltersComponent],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  templateUrl: './stats-dashboard.component.html',
  styleUrls: ['./stats-dashboard.component.scss'],
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
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class StatsDashboardComponent implements OnInit {
  isMinimized = false;

  // Variables para el progreso de captura
  percentageCaptured!: number;
  captured!: number;
  expected!: number;

  // Variables para el último indicador actualizado
  lastUpdate: IndicatorData | null = null;
  isLoadingLastUpdate = true;

  // Variables para el progreso por departamento
  radialbarChartOptions: Partial<ChartOptions> = {};
  totalPendingIndicators: number = 0;
  isLoadingDepartments: boolean = true;
  hasChartData: boolean = false;

  //variables para filtrado
  private filtersSubscription!: Subscription;

  private themeSubscription = Subscription.EMPTY;
  isDarkTheme = false;

  constructor(
    private statisticsService: StatisticsService,
    private sharedFiltersService: SharedFiltersService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public themeService: ThemeService
  ) {
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => {
        this.isDarkTheme = isDark;
        this.updateTrackColor();
      }
    );
  }

  private updateTrackColor(): void {
    if (this.radialbarChartOptions.plotOptions?.radialBar?.track) {
      this.radialbarChartOptions = {
        ...this.radialbarChartOptions,
        plotOptions: {
          ...this.radialbarChartOptions.plotOptions,
          radialBar: {
            ...this.radialbarChartOptions.plotOptions.radialBar,
            track: {
              ...this.radialbarChartOptions.plotOptions.radialBar.track,
              background: this.isDarkTheme ? "#ffffff11" : "#e7e7e7"
            }
          }
        }
      };
    }
  }

  ngOnInit() {
    this.filtersSubscription = this.sharedFiltersService.currentFilters.subscribe(filters => {
      this.loadDataWithFilters(filters);
    });
  }

  ngOnDestroy() {
    this.filtersSubscription.unsubscribe();
  }

  private loadDataWithFilters(filters: any) {
    this.loadPercentageCaptured(filters);
    this.loadLastUpdate(filters);
    this.loadDepartmentsProgress(filters);
  }

  private loadPercentageCaptured(filters: any): void {
    this.statisticsService.getPercentageCaptured(
      filters.periodIds.length ? filters.periodIds : undefined,
      filters.departmentIds.length ? filters.departmentIds : undefined,
      filters.semesters.length ? filters.semesters : undefined,
      filters.years.length ? filters.years.map((y: string) => +y) : undefined,
      filters.startDate,
      filters.endDate
    ).subscribe({
      next: (data: any) => {
        this.percentageCaptured = data.percentage;
        this.captured = data.captured;
        this.expected = data.expected;
      },
      error: (error) => {
        // console.error('Error fetching percentage captured:', error);
      }
    });
  }

  private loadLastUpdate(filters: any): void {
    this.isLoadingLastUpdate = true;
    this.statisticsService.getLastUpdate(
      filters.periodIds.length ? filters.periodIds : undefined,
      filters.departmentIds.length ? filters.departmentIds : undefined,
      filters.semesters.length ? filters.semesters : undefined,
      filters.years.length ? filters.years.map((y: string) => +y) : undefined,
      filters.startDate,
      filters.endDate
    ).subscribe({
      next: (data) => {
        this.lastUpdate = data;
        this.isLoadingLastUpdate = false;
      },
      error: (error) => {
        this.isLoadingLastUpdate = false;
        // console.error('Error fetching last update:', error);
      }
    });
  }

  private loadDepartmentsProgress(filters: any): void {
    this.isLoadingDepartments = true;
    this.statisticsService.getCaptureProgressByDepartment(
      4, // limit
      filters.periodIds.length ? filters.periodIds : undefined,
      filters.departmentIds.length ? filters.departmentIds : undefined,
      filters.semesters.length ? filters.semesters : undefined,
      filters.years.length ? filters.years.map((y: string) => +y) : undefined,
      filters.startDate,
      filters.endDate
    ).subscribe({
      next: (response: CaptureProgressResponse) => {
        this.totalPendingIndicators = response.total;
        const series = response.byDepartments.map(dep => dep.percentage);
        const labels = response.byDepartments.map(dep => dep.departmentName);
        this.hasChartData = series.length > 0;

        this.radialbarChartOptions = {
          series,
          labels,
          chart: {
            id: 'radial-chart',
            type: 'radialBar',
            height: 320,
            fontFamily: "'Roboto', sans-serif",
            toolbar: {
              show: true,
            },
          },
          colors: ["#1ab7ea", "#0084ff", "#39539E", "#0077B5"],
          plotOptions: {
            radialBar: {
              offsetY: 0,
              startAngle: -90,
              endAngle: 90,
              track: {
                background: this.isDarkTheme ? "#ffffff11" : "#e7e7e7",
              },
              hollow: {
                margin: 5,
                size: "25%",
                background: "transparent",
                image: undefined
              },
              dataLabels: {
                name: {
                  show: false
                },
                value: {
                  show: false
                }
              }
            }
          },
          legend: {
            show: true,
            floating: false,
            fontSize: "12px",
            position: "right",
            horizontalAlign: "center",
            offsetX: 0,
            offsetY: 30,
            labels: {
              useSeriesColors: true
            },
            formatter: function (seriesName, opts) {
              return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%";
            },
            itemMargin: {
              horizontal: 13
            }
          },
          responsive: [
            {
              breakpoint: 768,
              options: {
                chart: {
                  height: 280
                },
                legend: {
                  position: 'bottom',
                  offsetY: 0,
                  horizontalAlign: 'center'
                }
              }
            },
            {
              breakpoint: 480,
              options: {
                chart: {
                  height: 250
                },
                legend: {
                  show: false
                }
              }
            }
          ],
          stroke: {
            lineCap: "round"
          }
        };

        this.isLoadingDepartments = false;
      },
      error: (error) => {
        this.isLoadingDepartments = false;
        // console.error('Error fetching departments progress:', error);
      }
    });
  }

  hasActiveFilters(): boolean {
    return this.sharedFiltersService.getAnyActiveFilter();
  }

  openDetailsDialog(): void {
    if (this.lastUpdate) {
      this.dialog.open(IndicatorDetailsDialogComponent, {
        width: '400px',
        data: this.lastUpdate
      });
    }
  }

  showAllDepartmentsProgress(): void {
    const currentFilters = this.sharedFiltersService.getCurrentFilterValues();
    this.statisticsService.getCaptureProgressByDepartment(
      100,
      currentFilters.periodIds.length ? currentFilters.periodIds : undefined,
      currentFilters.departmentIds.length ? currentFilters.departmentIds : undefined,
      currentFilters.semesters.length ? currentFilters.semesters : undefined,
      currentFilters.years.length ? currentFilters.years.map((y: string) => +y) : undefined,
      currentFilters.startDate,
      currentFilters.endDate
    ).subscribe({
      next: (response: CaptureProgressResponse) => {
        this.dialog.open(DepartmentProgressDialogComponent, {
          width: '60vw',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: response
        });
      },
      error: (error) => {
        // console.error('Error fetching all departments progress:', error);
        this.snackBar.open('Error al obtener datos de departamentos', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  toggleMinimized(): void {
    this.isMinimized = !this.isMinimized;
  }
}