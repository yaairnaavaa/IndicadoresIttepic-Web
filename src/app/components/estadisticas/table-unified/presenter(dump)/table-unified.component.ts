import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { IndicatorData, IndicatorDataUnified } from 'src/app/models/indicator-data.model';
import { StatisticsService } from 'src/app/services/statistics.service';
import { MaterialModule } from 'src/app/material.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-unified-indicators-table',
  imports: [
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MaterialModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDividerModule,
  ],
  providers: [provideNativeDateAdapter(), DatePipe, { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  templateUrl: './table-unified.component.html',
  styleUrls: ['./table-unified.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
    trigger('filterExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})
export class AppTableUnifiedComponent {
  constructor(
    private statisticsService: StatisticsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      reports: [[]],
      startDateFrom: [null],
      startDateTo: [null],
      endDateFrom: [null],
      endDateTo: [null],
      departments: [[]],
      semester: [[]],
      yearFrom: [null],
      yearTo: [null],
      goalFrom: [null],
      goalTo: [null],
      valueFrom: [null],
      valueTo: [null],
      status: [[]]
    });
  }
  @Input() data: IndicatorDataUnified[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  filterForm: FormGroup;
  isFilterExpanded = false;

  dataSource = new MatTableDataSource<IndicatorDataUnified>([]);
  columnsToDisplay = ['index', 'key', 'name', 'report', 'startDate', 'endDate', 'department', 'semester', 'year', 'goal', 'value'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: IndicatorData | null = null;
  resultsLength = 0;

  // Opciones para los selects múltiples
  reportOptions: string[] = [];
  departmentOptions: string[] = [];
  semesterOptions = ['ENE-JUN', 'AGO-DIC'];
  statusOptions = ['Capturado', 'Pendiente', 'No capturado'];

  ngOnChanges(): void {
    if (this.data) {
      this.dataSource.data = this.data;
      this.updateFilterOptions();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort!;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'report': return item.report;
        case 'department': return item.departmentName;
        case 'semester': return item.periodSemester;
        case 'year': return item.periodYear;
        default: return (item as any)[property];
      }
    };
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
  }

  private updateFilterOptions(): void {
    this.reportOptions = [...new Set(this.data.map(item => item.report))];
    this.departmentOptions = [...new Set(this.data.map(item => item.departmentName))];
  }

  applyFilter() {
    const {
      search,
      reports,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      departments,
      semester,
      yearFrom,
      yearTo,
      goalFrom,
      goalTo,
      valueFrom,
      valueTo,
      status
    } = this.filterForm.value;

    this.dataSource.filterPredicate = (data: IndicatorDataUnified, _: string) => {
      // Filtro por clave o nombre
      const matchesSearch = !search ||
        data.key.toLowerCase().includes(search.toLowerCase()) ||
        data.name.toLowerCase().includes(search.toLowerCase());

      // Filtro por reportes
      const matchesReports = !reports.length || reports.includes(data.report);

      // Filtro por fechas de inicio
      const startDate = new Date(data.startDate);
      const matchesStartDate =
        (!startDateFrom || startDate >= new Date(startDateFrom)) &&
        (!startDateTo || startDate <= new Date(startDateTo));

      // Filtro por fechas de cierre
      const endDate = new Date(data.endDate);
      const matchesEndDate =
        (!endDateFrom || endDate >= new Date(endDateFrom)) &&
        (!endDateTo || endDate <= new Date(endDateTo));

      // Filtro por departamentos
      const matchesDepartments = !departments.length || departments.includes(data.departmentName);

      // Filtro por semestre
      const matchesSemester = !semester.length || semester.includes(data.periodSemester);

      // Filtro por año
      const matchesYear = (!yearFrom || data.periodYear >= yearFrom) && (!yearTo || data.periodYear <= yearTo);

      // Filtro por meta
      const matchesGoal = (!goalFrom || data.goal >= goalFrom) && (!goalTo || data.goal <= goalTo);

      // Filtro por valor
      const matchesValue = (!valueFrom || data.dataValue! >= valueFrom) && (!valueTo || data.dataValue! <= valueTo);

      // Filtro por estado
      const matchesStatus = !status.length ||
        (status.includes('Capturado') && data.dataValue !== null) ||
        (status.includes('Pendiente') && data.status === 'Pendiente') ||
        (status.includes('No capturado') && data.status === 'No capturado');
      return (
        matchesSearch &&
        matchesReports &&
        matchesStartDate &&
        matchesEndDate &&
        matchesDepartments &&
        matchesSemester &&
        matchesYear &&
        matchesGoal &&
        matchesValue &&
        matchesStatus
      );
    };

    this.dataSource.filter = '' + Math.random(); // Forzar recálculo
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      reports: [],
      startDateFrom: null,
      startDateTo: null,
      endDateFrom: null,
      endDateTo: null,
      departments: [],
      semester: [],
      yearFrom: null,
      yearTo: null,
      goalFrom: null,
      goalTo: null,
      valueFrom: null,
      valueTo: null,
      status: []
    });
    this.applyFilter();
  }

  toggleFilterPanel() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  getUserGrade(grades: any[]): string {
    return grades?.length ? grades[0].abbreviation + ' ' : '';
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Indicadores Unificados');

    const columnsToExport = this.columnsToDisplay
      .filter(col => col !== 'index' && col !== 'expand')
      .map(col => {
        switch (col) {
          case 'key': return 'Clave';
          case 'name': return 'Nombre';
          case 'report': return 'Reporte';
          case 'startDate': return 'Fecha de inicio';
          case 'endDate': return 'Fecha de cierre';
          case 'department': return 'Departamento';
          case 'semester': return 'Semestre';
          case 'year': return 'Año';
          case 'goal': return 'Meta';
          case 'value': return 'Valor';
          default: return col;
        }
      });

    worksheet.addRow(columnsToExport);

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    this.dataSource.filteredData.forEach((indicator: any) => {
      const rowData = [
        indicator.key,
        indicator.name,
        indicator.report,
        indicator.startDate ? new Date(indicator.startDate).toLocaleDateString() : '',
        indicator.endDate ? new Date(indicator.endDate).toLocaleDateString() : '',
        indicator.departmentName,
        indicator.periodSemester,
        indicator.periodYear,
        indicator.goal,
        indicator.dataValue !== null ? indicator.dataValue : indicator.status
      ];
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((column, index) => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    const dateColumns = ['Fecha de inicio', 'Fecha de cierre'];
    dateColumns.forEach(colName => {
      const colIndex = columnsToExport.indexOf(colName) + 1;
      if (colIndex > 0) {
        worksheet.getColumn(colIndex).numFmt = 'dd/mm/yyyy';
      }
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Indicadores_Unificados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}