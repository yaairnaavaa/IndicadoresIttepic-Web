import { Component, Input, Output, EventEmitter, ViewChild, OnInit, SimpleChanges, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { Observable, of } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  standalone: true,
  selector: 'app-indicator-table',
  templateUrl: './indicators-table.component.html',
  styleUrls: ['./indicators-table.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  animations: [
    trigger('filterExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ]
})
export class IndicatorTableComponent implements AfterViewInit {
  hasData = false;

  @Input() set data(value: IndicatorDefinition[]) {
    this.dataSource.data = value;
    this.updateDepartmentsList();
    this.hasData = this.dataSource.data.length > 0;
  }
  @Input() displayedColumns: string[] = [];
  @Input() preSelectedIndicators: IndicatorDefinition[] = [];
  @Input() showCheckboxes: boolean = false;
  @Input() showActions: boolean = false;
  @Input() showExportButton: boolean = false;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 100];
  @Input() pageSize: number = 10;
  @Input() set selectAll(value: boolean) {
    if (value && this.dataSource.filteredData.length > 0) {
      this.selectedIndicators = [...this.dataSource.filteredData];
      this.rowSelected.emit([...this.selectedIndicators]);
    }
  }

  @Output() rowSelected = new EventEmitter<IndicatorDefinition[]>();
  @Output() editAction = new EventEmitter<IndicatorDefinition>();
  @Output() createAction = new EventEmitter<void>();

  dataSource = new MatTableDataSource<IndicatorDefinition>([]);
  isFilterExpanded = false;
  selectedIndicators: IndicatorDefinition[] = [];
  searchControl = new FormControl('');
  departmentsControl = new FormControl<string[]>([]);
  minGoalControl = new FormControl<number | null>(null);
  maxGoalControl = new FormControl<number | null>(null);

  allDepartments: string[] = [];
  filteredDepartments$: Observable<string[]>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngAfterViewInit(): void {
    this.setupColumns();
    this.setupFilterListeners();

    // Preseleccionar indicadores si existen
    if (this.preSelectedIndicators && this.preSelectedIndicators.length > 0) {
      this.selectedIndicators = [...this.preSelectedIndicators];
      this.rowSelected.emit(this.selectedIndicators); // Emitir los seleccionados iniciales
    }

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private setupColumns(): void {
    if (this.showCheckboxes && !this.displayedColumns.includes('select')) {
      this.displayedColumns.unshift('select');
    }
    if (this.showActions && !this.displayedColumns.includes('actions')) {
      this.displayedColumns.push('actions');
    }
  }

  private setupFilterListeners(): void {
    this.searchControl.valueChanges.subscribe(() => this.applyFilter());
    this.departmentsControl.valueChanges.subscribe(() => this.applyFilter());
    this.minGoalControl.valueChanges.subscribe(() => this.applyFilter());
    this.maxGoalControl.valueChanges.subscribe(() => this.applyFilter());
  }

  private updateDepartmentsList(): void {
    const allDepts = new Set<string>();
    this.dataSource.data.forEach(indicator => {
      indicator.departments?.forEach(dept => {
        if (dept.name) allDepts.add(dept.name);
      });
    });
    this.allDepartments = Array.from(allDepts).sort();

    this.filteredDepartments$ = of(this.allDepartments);
  }

  private createFilter(): (data: IndicatorDefinition, filter: string) => boolean {
    return (indicator: IndicatorDefinition) => {
      const searchFilter = this.searchControl.value?.toLowerCase() || '';
      const matchesSearch = !searchFilter ||
        indicator.key.toLowerCase().includes(searchFilter) ||
        indicator.name.toLowerCase().includes(searchFilter);

      const selectedDepartments = this.departmentsControl.value || [];
      const matchesDepartments = selectedDepartments.length === 0 ||
        (indicator.departments && indicator.departments.some(dept =>
          selectedDepartments.includes(dept.name)));

      const minGoal = this.minGoalControl.value;
      const maxGoal = this.maxGoalControl.value;
      const matchesGoalRange =
        (minGoal === null || indicator.goal >= minGoal) &&
        (maxGoal === null || indicator.goal <= maxGoal);

      return matchesSearch && matchesDepartments && matchesGoalRange;
    };
  }

  applyFilter(): void {
    this.dataSource.filter = 'trigger';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.departmentsControl.setValue([]);
    this.minGoalControl.setValue(null);
    this.maxGoalControl.setValue(null);
  }

  toggleFilterPanel() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  // Función auxiliar para obtener un identificador único del indicador
  private getIndicatorId(indicator: IndicatorDefinition): string {
    return indicator._id || indicator.key || '';
  }

  isSelected(indicator: IndicatorDefinition): boolean {
    const indicatorId = this.getIndicatorId(indicator);
    return this.selectedIndicators.some(i => this.getIndicatorId(i) === indicatorId);
  }

  public toggleSelection(indicator: IndicatorDefinition): void {
    const indicatorId = this.getIndicatorId(indicator);
    const index = this.selectedIndicators.findIndex(i => this.getIndicatorId(i) === indicatorId);

    if (index >= 0) {
      this.selectedIndicators.splice(index, 1);
    } else {
      this.selectedIndicators.push(indicator);
    }
    this.rowSelected.emit([...this.selectedIndicators]);
  }

  allSelected(): boolean {
    return this.selectedIndicators.length === this.dataSource.filteredData.length && this.dataSource.filteredData.length > 0;
  }

  someSelected(): boolean {
    const visibleData = this.dataSource.filteredData;
    return this.selectedIndicators.length > 0 && this.selectedIndicators.length < visibleData.length;
  }

  toggleAllRows(): void {
    const visibleData = this.dataSource.filteredData;
    if (this.allSelected()) {
      this.selectedIndicators = [];
    } else {
      // Crear una nueva copia de los datos visibles
      this.selectedIndicators = [...visibleData];
    }
    this.rowSelected.emit([...this.selectedIndicators]);
  }

  handleRowClick(row: IndicatorDefinition, event: MouseEvent): void {
    if (this.showCheckboxes && (event.target as HTMLElement).tagName.toLowerCase() !== 'mat-checkbox') {
      this.toggleSelection(row);
    }
  }

  onEdit(indicator: IndicatorDefinition): void {
    this.editAction.emit(indicator);
  }

  onCreate(): void {
    this.createAction.emit();
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Indicadores');

    const columnsToExport = this.displayedColumns
      .filter(col => col !== 'actions' && col !== 'index')
      .map(col => {
        switch (col) {
          case 'key': return 'Clave';
          case 'name': return 'Nombre';
          case 'description': return 'Descripción';
          case 'goal': return 'Meta';
          case 'department': return 'Departamento(s)';
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

    this.dataSource.filteredData.forEach(indicator => {
      const rowData = [
        indicator.key,
        indicator.name,
        indicator.description,
        indicator.goal,
        indicator.departments?.map(dept => dept.name).join(', ') || ''
      ];
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach(column => {
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
      saveAs(blob, `Indicadores_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}