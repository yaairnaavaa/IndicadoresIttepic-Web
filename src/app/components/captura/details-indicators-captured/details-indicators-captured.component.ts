import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { ReportPeriod } from 'src/app/models/reportPeriod.model';
import { IndicatorDataService } from 'src/app/services/indicator-data.service';
import { IndicatorData } from 'src/app/models/indicator-data.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EditIndicatorDataDialogComponent } from '../edit-indicatorData-dialog/edit-indicatorData-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-details-indicators-captured',
  templateUrl: 'details-indicators-captured.component.html',
  styleUrl: 'details-indicators-captured.component.scss',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  animations: [
    trigger('filterExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
  providers: [provideNativeDateAdapter(), DatePipe, { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
})
export class DetailsIndicatorsCapturedComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  @Input() reportPeriod!: ReportPeriod;
  @Input() isJefeEspecial!: boolean;
  @Input() userDeptId!: string;

  isLoading: boolean = false;
  displayedColumns: string[];
  dataSource = new MatTableDataSource<IndicatorData>([]);
  isFilterExpanded = false;
  resultsLength = 0;

  keyNameFilter = new FormControl('');
  goalMinFilter = new FormControl<number | null>(null);
  goalMaxFilter = new FormControl<number | null>(null);
  valueMinFilter = new FormControl<number | null>(null);
  valueMaxFilter = new FormControl<number | null>(null);
  departmentFilter = new FormControl<string[]>([]);
  startDateFilter = new FormControl('');
  endDateFilter = new FormControl('');

  departmentOptions: string[] = [];

  constructor(
    private indicatorDataService: IndicatorDataService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadIndicators();
    this.setupFilterListeners();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  private loadIndicators(): void {
    const data$ = this.isJefeEspecial
      ? this.indicatorDataService.getByReportPeriod(this.reportPeriod._id!)
      : this.indicatorDataService.getByReportPeriodAndDepartment(this.reportPeriod._id!, this.userDeptId!);

    this.displayedColumns = ['index', 'key', 'name', 'goal', 'value'];

    if (this.isJefeEspecial) {
      this.displayedColumns.push('department');
    }

    this.displayedColumns.push('updatedAt', 'actions');

    data$.subscribe({
      next: (data: IndicatorData[]) => {
        const dataConIndice = data.map((item, idx) => ({
          ...item,
          index: idx + 1,
        }));

        this.dataSource.data = dataConIndice;
        this.resultsLength = data.length;
        this.isLoading = false;

        if (this.isJefeEspecial) {
          this.departmentOptions = [...new Set(data.map(item => item.department.name))];
        }

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      },
      error: (err) => {
        this.snackBar.open('Error cargando indicadores capturados', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.isLoading = false;
      }
    });
  }

  private setupFilterListeners(): void {
    this.keyNameFilter.valueChanges.subscribe(() => this.applyFilter());
    this.goalMinFilter.valueChanges.subscribe(() => this.applyFilter());
    this.goalMaxFilter.valueChanges.subscribe(() => this.applyFilter());
    this.valueMinFilter.valueChanges.subscribe(() => this.applyFilter());
    this.valueMaxFilter.valueChanges.subscribe(() => this.applyFilter());
    this.departmentFilter.valueChanges.subscribe(() => this.applyFilter());
    this.startDateFilter.valueChanges.subscribe(() => this.applyFilter());
    this.endDateFilter.valueChanges.subscribe(() => this.applyFilter());
  }

  private applyFilter(): void {
    this.dataSource.filterPredicate = (data: IndicatorData, filter: string) => {
      const filters = JSON.parse(filter);
      const matches = [];

      if (filters.keyName) {
        const keyMatch = data.definition.key.toLowerCase().includes(filters.keyName.toLowerCase());
        const nameMatch = data.definition.name.toLowerCase().includes(filters.keyName.toLowerCase());
        matches.push(keyMatch || nameMatch);
      }

      if (filters.goalMin !== null || filters.goalMax !== null) {
        const goal = data.definition.goal;
        const minMatch = filters.goalMin === null || goal >= filters.goalMin;
        const maxMatch = filters.goalMax === null || goal <= filters.goalMax;
        matches.push(minMatch && maxMatch);
      }

      if (filters.valueMin !== null || filters.valueMax !== null) {
        const value = data.value;
        const minMatch = filters.valueMin === null || value >= filters.valueMin;
        const maxMatch = filters.valueMax === null || value <= filters.valueMax;
        matches.push(minMatch && maxMatch);
      }

      if (filters.department && filters.department.length > 0) {
        matches.push(filters.department.includes(data.department.name));
      }

      if (filters.startDate || filters.endDate) {
        const updatedAt = new Date(data.updatedAt!);
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;

        let dateMatch = true;
        if (startDate) dateMatch = dateMatch && updatedAt >= startDate;
        if (endDate) dateMatch = dateMatch && updatedAt <= endDate;
        matches.push(dateMatch);
      }

      return matches.every(match => match);
    };

    const filterValue = {
      keyName: this.keyNameFilter.value,
      goalMin: this.goalMinFilter.value,
      goalMax: this.goalMaxFilter.value,
      valueMin: this.valueMinFilter.value,
      valueMax: this.valueMaxFilter.value,
      department: this.departmentFilter.value,
      startDate: this.startDateFilter.value,
      endDate: this.endDateFilter.value
    };

    this.dataSource.filter = JSON.stringify(filterValue);
  }

  clearFilters(): void {
    this.keyNameFilter.setValue('');
    this.goalMinFilter.setValue(null);
    this.goalMaxFilter.setValue(null);
    this.valueMinFilter.setValue(null);
    this.valueMaxFilter.setValue(null);
    this.departmentFilter.setValue([]);
    this.startDateFilter.setValue('');
    this.endDateFilter.setValue('');
  }

  toggleFilterPanel() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  onEditIndicator(indicatorData: IndicatorData): void {
    window.scrollTo({ top: 0 }); //esto debido a que al mostrar el dialog hay un desborde que ocasiona que la vista se desplace hacia abajo
    const dialogRef = this.dialog.open(EditIndicatorDataDialogComponent, {
      width: '300px',
      data: { indicatorData },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(updatedIndicator => {
      if (updatedIndicator) {
        this.indicatorDataService.update(updatedIndicator._id, updatedIndicator).subscribe({
          next: () => {
            this.loadIndicators();
            this.cdr.detectChanges();
            this.snackBar.open('Valor actualizado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: () => {
            this.snackBar.open('Error al actualizar el indicador', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }
        });
      }
    });
  }
  isEditable(indicator: IndicatorData): boolean {
    if (!indicator.reportPeriod?.dueDate) return true;
    const currentDate = new Date();
    const dueDate = new Date(indicator.reportPeriod.dueDate);
    return currentDate <= dueDate;
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.reportPeriod.reportId.name + ' - ' + this.reportPeriod.semester + this.reportPeriod.year);

    const columnsToExport = ['Clave', 'Nombre', 'Meta', 'Valor capturado'];
    if (this.isJefeEspecial) {
      columnsToExport.push('Departamento');
    }
    columnsToExport.push('Fecha de captura');

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

    this.dataSource.filteredData.forEach(indicator => {
      const rowData: (string | number)[] = [
        indicator.definition.key,
        indicator.definition.name,
        indicator.definition.goal,
        indicator.value
      ];
      if (this.isJefeEspecial) {
        rowData.push(indicator.department.name);
      }
      rowData.push(
        this.datePipe.transform(indicator.updatedAt, 'yyyy-MM-dd') || ''
      );
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell!({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength + 2;
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Indicadores_Capturados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }

}