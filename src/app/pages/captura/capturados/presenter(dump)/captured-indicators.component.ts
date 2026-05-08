import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ReportPeriod } from 'src/app/models/reportPeriod.model';
import { DetailsIndicatorsCapturedComponent } from 'src/app/components/captura/details-indicators-captured/details-indicators-captured.component';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-captured-indicators-table',
  providers: [provideNativeDateAdapter(), DatePipe, { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  templateUrl: './captured-indicators.component.html',
  styleUrls: ['./captured-indicators.component.scss'],
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    FormsModule,
    MatPaginatorModule,
    MatSortModule,
    ReactiveFormsModule,
    DetailsIndicatorsCapturedComponent
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 })),
      ]),
    ]),
    trigger('filterExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})
export class CapturedIndicatorsComponent{
  @Input() data: ReportPeriod[] = [];
  @Input() isJefeEspecial = false;
  @Input() userDeptId = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  filterForm: FormGroup;
  isFilterExpanded = false;
  hasData = false;
  displayedColumns: string[] = ['index', 'report', 'startDate', 'endDate', 'semester', 'year', 'actions'];
  dataSource = new MatTableDataSource<ReportPeriod>([]);
  resultsLength = 0;
  selectedReport: ReportPeriod | null = null;
  userRole: string = '';
  userDept: string = '';

  constructor(
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      semester: [[]],
      yearFrom: [null],
      yearTo: [null],
      startDateFrom: [null],
      startDateTo: [null],
      endDateFrom: [null],
      endDateTo: [null]
    });
  }

  ngOnChanges(): void {
    if (this.data.length) {
      this.hasData = true;
      this.dataSource.data = this.data;
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort!;
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
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
      endDateTo
    } = this.filterForm.value;

    this.dataSource.filterPredicate = (data: ReportPeriod, _: string) => {
      const matchesName = data.reportId.name.toLowerCase().includes((name || '').toLowerCase());

      const matchesSemester = !semester.length || semester.includes(data.semester);

      const matchesYear = (!yearFrom || data.year >= yearFrom) && (!yearTo || data.year <= yearTo);

      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      const matchesStartDate =
        (!startDateFrom || startDate >= new Date(startDateFrom)) &&
        (!startDateTo || startDate <= new Date(startDateTo));

      const matchesEndDate =
        (!endDateFrom || endDate >= new Date(endDateFrom)) &&
        (!endDateTo || endDate <= new Date(endDateTo));

      return (
        matchesName &&
        matchesSemester &&
        matchesYear &&
        matchesStartDate &&
        matchesEndDate
      );
    };

    this.dataSource.filter = '' + Math.random(); // Force filter update
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
      endDateTo: null
    });
    this.applyFilter();
  }

  toggleFilterPanel() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  viewReportDetails(report: ReportPeriod) {
    this.selectedReport = report;
  }

  goBack() {
    this.selectedReport = null;
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reportes Capturados');

    const columnsToExport = ['#', 'Reporte', 'Fecha de inicio', 'Fecha de cierre', 'Semestre', 'Año'];
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

    this.dataSource.filteredData.forEach(report => {
      const rowData = [
        report.index,
        report.reportId.name,
        report.startDate ? new Date(report.startDate).toLocaleDateString() : '',
        report.endDate ? new Date(report.endDate).toLocaleDateString() : '',
        report.semester,
        report.year
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

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Reportes_Capturados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}