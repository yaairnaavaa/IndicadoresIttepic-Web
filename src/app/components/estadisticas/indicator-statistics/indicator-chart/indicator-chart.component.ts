import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexStroke,
  ApexLegend,
  ApexXAxis,
  ApexYAxis
} from 'ng-apexcharts';
import { CommonModule } from '@angular/common';
import { IndicatorDataReport } from 'src/app/models/indicator-data.model';
import { ThemeService } from 'src/app/services/theme.service';
import { Subscription } from 'rxjs';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  dataLabels: ApexDataLabels;
  stroke: any;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  colors: string[];
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
};

export interface ChartIndicator {
  id: string;
  key: string;
  name: string;
  report: string;
  department: string;
  visible: boolean;
}

@Component({
  selector: 'app-indicator-chart',
  imports: [ChartComponent, CommonModule],
  templateUrl: './indicator-chart.component.html',
  styleUrls: ['./indicator-chart.component.scss'],
  standalone: true
})
export class IndicatorChartComponent implements OnChanges {
  @ViewChild('chart') chart: ChartComponent;

  @Input() reportData: IndicatorDataReport[] = [];
  @Input() visibleIndicators: ChartIndicator[] = [];
  @Input() barColor: string = '#2a4a9bff';
  @Input() goalColor: string = '#49cff7ff';
  @Input() trendColor: string = '#b6b6b6ff';

  private isMouseOverChart: boolean = false;

  public chartOptions: Partial<ChartOptions>;
  public noDataAvailable: boolean = false;


  categories: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reportData'] || changes['visibleIndicators']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    const visibleIndicatorIds = this.visibleIndicators
      .filter(ind => ind.visible)
      .map(ind => ind.id);

    const filteredData = this.reportData.filter(item =>
      visibleIndicatorIds.includes(item._id)
    );

    this.noDataAvailable = filteredData.length === 0;

    if (this.noDataAvailable) return;

    const seriesData = this.transformBackendData(filteredData);

    this.chartOptions = {
      series: seriesData,
      chart: {
        height: 450,
        type: 'line',
        stacked: false,
      },
      plotOptions: {
        bar: {
          columnWidth: '20%',

        }
      },
      colors: [this.barColor, this.goalColor, this.trendColor],
      dataLabels: {
        enabled: false
      },
      labels: this.categories,
      stroke: {
        width: [0, 0, 3],
        curve: 'smooth',
        dashArray: [0, 0, 8]
      },
      xaxis: {
        type: 'category',
        labels: {
          rotate: -75,
          style: {
            fontSize: '8px',
            fontWeight: 'bold',
          },
        }
      },
      yaxis: [{
        title: {
          text: 'Valores',
        },
        labels: {
          formatter: (val: number) => val.toFixed(0)
        }
      },
      {
        title: {
          text: 'Metas',
        },
        opposite: true,
        labels: {
          formatter: (val: number) => val.toFixed(0)
        }
      }
      ],
      legend: {
        show: true,
        showForSingleSeries: true,
        markers: {
          fillColors: [this.barColor, this.goalColor, this.trendColor],
        },
        onItemClick: {
          toggleDataSeries: true
        }
      }

    };
  }

  private transformBackendData(backendData: IndicatorDataReport[]): any {
    // console.log(backendData);


    this.categories = backendData.map((item, i) =>
      `${item.definition.key} [${item.reportPeriod.semester}-${item.reportPeriod.year}]`
    );

    const valueData = backendData.map(item => item.value);
    const goalData = backendData.map(item => item.definition.goal);
    const trendData = this.calculateTrendLine(valueData);

    return [
      { name: 'Valor', type: 'column', data: valueData },
      { name: 'Meta', type: 'column', data: goalData },
      { name: 'Tendencia', type: 'line', data: trendData }
    ];
  }

  private calculateTrendLine(data: number[]): number[] {
    const n = data.length;
    if (n === 0) return [];

    // Calcular sumatorias para la regresión lineal
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((y, i) => {
      const x = i; // Usamos el índice como valor x (tiempo)
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    // Calcular pendiente (m) e intercepto (b)
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    // Generar puntos de la línea de tendencia
    return data.map((_, i) => m * i + b);
  }

  private calculateSimpleTrend(data: number[], windowSize: number = 2): number[] {
    return data.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const end = i + 1;
      const window = data.slice(start, end);
      return window.reduce((a, b) => a + b, 0) / window.length;
    });
  }


  onChartMouseEnter(): void {
    this.isMouseOverChart = true;
  }

  onChartMouseLeave(): void {
    this.isMouseOverChart = false;
  }

  onChartWheel(event: WheelEvent): void {
    if (this.isMouseOverChart) {
      event.preventDefault(); // Previene el scroll general de la página
    }
  }
}