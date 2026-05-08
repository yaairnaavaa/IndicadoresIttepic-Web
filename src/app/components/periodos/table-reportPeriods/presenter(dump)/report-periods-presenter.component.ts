import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from 'src/app/material.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReportPeriod } from 'src/app/models/reportPeriod.model';
import { Report } from 'src/app/models/report.model';
import { IndicatorTableComponent } from 'src/app/components/indicadores/indicators-table/indicators-table.component';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-report-periods-presenter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    IndicatorTableComponent
  ],
  providers: [provideNativeDateAdapter(), DatePipe, { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  templateUrl: './report-periods-presenter.component.html',
  styleUrls: ['./report-periods-presenter.component.scss'],
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
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})
export class ReportPeriodsPresenterComponent {
  @Input() set data(value: ReportPeriod[]) {
    const dataConIndice = value.map((item, idx) => ({
      ...item,
      index: idx + 1,
    }));

    this.dataSource = new MatTableDataSource<ReportPeriod>(dataConIndice);
    this.resultsLength = this.dataSource.data.length;
  }
  @Input() error: string | null = null;

  @Output() edit = new EventEmitter<ReportPeriod>();
  @Output() create = new EventEmitter<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  isFilterExpanded = false;
  dataSource = new MatTableDataSource<ReportPeriod>([]);
  columnsToDisplay = ['index', 'report', 'semester', 'year', 'startDate', 'endDate', 'dueDate', 'status', 'actions'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: Report | null = null;
  resultsLength = 0;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      name: [''],
      semester: [[]],
      yearFrom: [null],
      yearTo: [null],
      startDateFrom: [null],
      startDateTo: [null],
      endDateFrom: [null],
      endDateTo: [null],
      dueDateFrom: [null],
      dueDateTo: [null],
      status: [[]]
    });
  }

  ngOnChanges() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter() {
    const {
      name,
      semester,
      yearFrom,
      yearTo,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      dueDateFrom,
      dueDateTo,
      status
    } = this.filterForm.value;

    this.dataSource.filterPredicate = (data: ReportPeriod, _: string) => {
      const matchesName = data.reportId.name.toLowerCase().includes((name || '').toLowerCase());
      const matchesSemester = !semester.length || semester.includes(data.semester);
      const matchesYear = (!yearFrom || data.year >= yearFrom) && (!yearTo || data.year <= yearTo);

      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const dueDate = new Date(data.dueDate);

      const matchesStartDate =
        (!startDateFrom || startDate >= new Date(startDateFrom)) &&
        (!startDateTo || startDate <= new Date(startDateTo));

      const matchesEndDate =
        (!endDateFrom || endDate >= new Date(endDateFrom)) &&
        (!endDateTo || endDate <= new Date(endDateTo));

      const matchesDueDate =
        (!dueDateFrom || dueDate >= new Date(dueDateFrom)) &&
        (!dueDateTo || dueDate <= new Date(dueDateTo));

      const matchesStatus =
        !status.length ||
        (status.includes('Activo') && data.isActive && !data.isExpired) ||
        (status.includes('Inactivo') && !data.isActive && !data.isExpired) ||
        (status.includes('Finalizado') && data.isExpired);

      return (
        matchesName &&
        matchesSemester &&
        matchesYear &&
        matchesStartDate &&
        matchesEndDate &&
        matchesDueDate &&
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
      name: '',
      semester: [],
      yearFrom: null,
      yearTo: null,
      startDateFrom: null,
      startDateTo: null,
      endDateFrom: null,
      endDateTo: null,
      dueDateFrom: null,
      dueDateTo: null,
      status: []
    });
    this.applyFilter();
  }

  toggleFilterPanel() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  onEdit(reportPeriod: ReportPeriod) {
    this.edit.emit(reportPeriod);
  }

  onCreate() {
    this.create.emit();
  }

  exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Periodos de captura');

    const columnsToExport = this.columnsToDisplay
      .filter(col => col !== 'index' && col !== 'expand' && col !== 'actions')
      .map(col => {
        switch (col) {
          case 'report': return 'Reporte';
          case 'semester': return 'Semestre';
          case 'year': return 'Año';
          case 'startDate': return 'Fecha de inicio';
          case 'endDate': return 'Fecha de cierre';
          case 'dueDate': return 'Fecha límite de captura';
          case 'status': return 'Estado';
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

    this.dataSource.filteredData.forEach((reportPeriod: any) => {
      const rowData = [
        reportPeriod.reportId?.name || '',
        reportPeriod.semester,
        reportPeriod.year,
        reportPeriod.startDate ? new Date(reportPeriod.startDate).toLocaleDateString() : '',
        reportPeriod.endDate ? new Date(reportPeriod.endDate).toLocaleDateString() : '',
        reportPeriod.dueDate ? new Date(reportPeriod.dueDate).toLocaleDateString() : '',
        reportPeriod.isExpired ? 'Finalizado' : (reportPeriod.isActive ? 'Activo' : 'Inactivo'),
        ''
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

    const dateColumns = ['Fecha de inicio', 'Fecha de cierre', 'Fecha límite de captura'];
    dateColumns.forEach(colName => {
      const colIndex = columnsToExport.indexOf(colName) + 1;
      if (colIndex > 0) {
        worksheet.getColumn(colIndex).numFmt = 'dd/mm/yyyy';
      }
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Periodos_Captura-Reportes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}