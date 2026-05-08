import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexStroke,
  ApexLegend,
  ApexXAxis,
  ApexYAxis
} from 'ng-apexcharts';
import { CommonModule } from '@angular/common';
import { IndicatorDataReport } from 'src/app/models/indicator-data.model';
import { ChartIndicator } from '../indicator-chart/indicator-chart.component';
import { MatIcon } from '@angular/material/icon';

export type ComparisonChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  legend: ApexLegend;
  colors: string[];
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
};

interface ComparisonConfig {
  compareBy: 'period' | 'department' | 'indicator';
  groupXBy: 'indicator' | 'indicator-department' | 'indicator-period';
  xAxisLabel: string;
}

@Component({
  selector: 'app-indicator-comparison-chart',
  imports: [ChartComponent, CommonModule, MatIcon],
  templateUrl: './indicator-comparison-chart.component.html',
  styleUrls: ['./indicator-comparison-chart.component.scss'],
  standalone: true
})
export class IndicatorComparisonChartComponent implements OnChanges {
  @ViewChild('chart') chart: ChartComponent;

  @Input() reportData: IndicatorDataReport[] = [];
  @Input() visibleIndicators: ChartIndicator[] = [];
  @Input() currentFilters: any = {};

  private isMouseOverChart: boolean = false;
  private colors = [
    '#2E93fA', '#66DA26', '#546E7A', '#E91E63', '#FF9800',
    '#00E676', '#9C27B0', '#FF5722', '#607D8B', '#795548',
    '#FFC107', '#3F51B5', '#4CAF50', '#F44336', '#009688'
  ];

  public chartOptions: Partial<ComparisonChartOptions>;
  public noDataAvailable: boolean = false;
  public comparisonType: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reportData'] || changes['visibleIndicators'] || changes['currentFilters']) {
      this.updateComparisonChart();
    }
  }

  private updateComparisonChart(): void {
    // Filtrar datos por indicadores visibles
    const visibleIndicatorIds = this.visibleIndicators
      .filter(ind => ind.visible)
      .map(ind => ind.id);

    const filteredData = this.reportData.filter(item =>
      visibleIndicatorIds.includes(item._id)
    );

    this.noDataAvailable = filteredData.length === 0;
    if (this.noDataAvailable) return;

    // Determinar qué se va a comparar y cómo agrupar el eje X
    const comparisonConfig = this.determineComparisonConfig(filteredData);
    this.buildChartWithConfig(filteredData, comparisonConfig);
  }

  private determineComparisonConfig(data: IndicatorDataReport[]): ComparisonConfig {
    const { departmentIds = [], periodIds = [], semesters = [], years = [] } = this.currentFilters;

    const uniqueDepartments = [...new Set(data.map(item => item.department._id))];
    const uniquePeriods = [...new Set(data.map(item => `${item.reportPeriod.semester}-${item.reportPeriod.year}`))];

    // Caso 1: Comparación por períodos (un solo departamento seleccionado o datos de un solo dept)
    if (uniqueDepartments.length === 1 && uniquePeriods.length > 1) {
      this.comparisonType = 'Períodos';
      return {
        compareBy: 'period',
        groupXBy: 'indicator-department',
        xAxisLabel: 'Indicadores por Departamento'
      };
    }

    // Caso 2: Comparación por departamentos (un solo período o datos de un solo período)
    if (uniquePeriods.length === 1 && uniqueDepartments.length > 1) {
      this.comparisonType = 'Departamentos';
      return {
        compareBy: 'department',
        groupXBy: 'indicator',
        xAxisLabel: 'Indicadores'
      };
    }

    // Caso 3: Comparación mixta (múltiples departamentos Y múltiples períodos)
    if (uniqueDepartments.length > 1 && uniquePeriods.length > 1) {
      // Priorizar por lo que tiene más variación en los filtros
      if (periodIds.length > departmentIds.length || years.length > 1 || semesters.length > 1) {
        this.comparisonType = 'Períodos';
        return {
          compareBy: 'period',
          groupXBy: 'indicator-department',
          xAxisLabel: 'Indicadores por Departamento'
        };
      } else {
        this.comparisonType = 'Departamentos';
        return {
          compareBy: 'department',
          groupXBy: 'indicator-period',
          xAxisLabel: 'Indicadores por Período'
        };
      }
    }

    // Caso 4: Fallback - solo un departamento y un período (no debería pasar, pero por seguridad)
    this.comparisonType = 'Indicadores';
    return {
      compareBy: 'indicator',
      groupXBy: 'indicator', // IND-001
      xAxisLabel: 'Indicadores'
    };
  }

  private buildChartWithConfig(data: IndicatorDataReport[], config: ComparisonConfig): void {
    // 1. Crear las categorías del eje X según la configuración
    const xCategories = this.createXCategories(data, config.groupXBy);

    // 2. Crear las series según qué se está comparando
    const series = this.createSeries(data, config, xCategories);

    this.chartOptions = {
      series: series,
      chart: {
        height: 450,
        type: 'line',
        stacked: false,
      },
      colors: series.map((_, index) => this.colors[index % this.colors.length]),
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      xaxis: {
        type: 'category',
        categories: xCategories,
        title: {
          text: config.xAxisLabel
        },
        labels: {
          style: {
            fontSize: '8px',
            fontWeight: 'bold',
          },
          rotate: -75,
        },
      },
      yaxis: {
        title: {
          text: 'Valores'
        },
        labels: {
          // formatter: (val: number) => val.toFixed(0)
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center'
      },
      grid: {
        padding: {
          left: 20,
          right: 20,
          bottom: 20
        }
      }
    };
  }

  private createXCategories(data: IndicatorDataReport[], groupXBy: string): string[] {
    const categorySet = new Set<string>();

    data.forEach(item => {
      let category: string;

      switch (groupXBy) {
        case 'indicator':
          category = item.definition.key;
          break;
        case 'indicator-department':
          category = `${item.definition.key}-${item.department.shortName}`;
          break;
        case 'indicator-period':
          category = `${item.definition.key} [${item.reportPeriod.semester}-${item.reportPeriod.year}]`;
          break;
        default:
          category = item.definition.key;
      }

      categorySet.add(category);
    });

    return Array.from(categorySet).sort();
  }

  private createSeries(data: IndicatorDataReport[], config: ComparisonConfig, xCategories: string[]): any[] {
    const seriesMap = new Map<string, Map<string, number>>();

    // Agrupar datos por lo que se está comparando
    data.forEach(item => {
      let seriesKey: string;
      let xKey: string;

      // Determinar la clave de la serie
      switch (config.compareBy) {
        case 'period':
          seriesKey = `${item.reportPeriod.semester} ${item.reportPeriod.year}`;
          break;
        case 'department':
          seriesKey = item.department.name;
          break;
        case 'indicator':
          seriesKey = item.definition.name;
          break;
        default:
          seriesKey = 'Serie 1';
      }

      // Determinar la clave X correspondiente
      switch (config.groupXBy) {
        case 'indicator':
          xKey = item.definition.key;
          break;
        case 'indicator-department':
          xKey = `${item.definition.key}-${item.department.shortName}`;
          break;
        case 'indicator-period':
          xKey = `${item.definition.key} [${item.reportPeriod.semester}-${item.reportPeriod.year}]`;
          break;
        default:
          xKey = item.definition.key;
      }

      if (!seriesMap.has(seriesKey)) {
        seriesMap.set(seriesKey, new Map());
      }

      seriesMap.get(seriesKey)!.set(xKey, item.value);
    });

    // Convertir a formato de ApexCharts
    return Array.from(seriesMap.entries()).map(([seriesName, dataMap]) => {
      const seriesData = xCategories.map(category =>
        dataMap.get(category) || null
      );

      return {
        name: seriesName,
        type: 'line',
        data: seriesData
      };
    });
  }

  // onChartMouseEnter(): void {
  //   this.isMouseOverChart = true;
  // }

  // onChartMouseLeave(): void {
  //   this.isMouseOverChart = false;
  // }

  // onChartWheel(event: WheelEvent): void {
  //   if (this.isMouseOverChart) {
  //     event.preventDefault();
  //   }
  // }
}