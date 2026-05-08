import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MaterialModule } from 'src/app/material.module';

export interface DepartmentProgress {
  departmentId: string;
  departmentName: string;
  departmentShortName: string;
  percentage: number;
  pending: number;
  total: number;
  captured: number;
}

export interface DepartmentProgressDialogData {
  total: number;
  byDepartments: DepartmentProgress[];
}

@Component({
  selector: 'app-department-progress-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule
  ],
  animations: [
    trigger('filterExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
  templateUrl: './department-progress-dialog.component.html',
  styleUrls: ['./department-progress-dialog.component.scss']
})
export class DepartmentProgressDialogComponent {
  displayedColumns: string[] = ['department', 'progress', 'details'];

  isFilterExpanded = false;
  allDepartments: DepartmentProgress[] = [];
  filteredDepartments: DepartmentProgress[] = [];
  selectedDepartments: string[] = [];
  sortState: Sort = { active: '', direction: '' };
  minProgress: number = 0;
  maxProgress: number = 100;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentProgressDialogData
  ) {
    this.allDepartments = [...data.byDepartments].reverse();
    this.filteredDepartments = [...this.allDepartments];
    this.selectedDepartments = this.allDepartments.map(d => d.departmentId);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#3fb566';
    if (percentage >= 50) return '#FFC107';
    return '#FF5252';
  }

  applyFilters(): void {
    this.filteredDepartments = this.allDepartments.filter(department => {
      const departmentMatch = this.selectedDepartments.includes(department.departmentId);
      const progressMatch = department.percentage >= (this.minProgress || 0) &&
        department.percentage <= (this.maxProgress || 100);
      return departmentMatch && progressMatch;
    });

    if (this.sortState.active) {
      this.sortData(this.sortState);
    }
  }

  resetFilters(): void {
    this.selectedDepartments = this.allDepartments.map(d => d.departmentId);
    this.minProgress = 0;
    this.maxProgress = 100;
    this.sortState = { active: '', direction: '' };
    this.applyFilters();
  }

  toggleFilterPanel() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  sortData(sort: Sort): void {
    this.sortState = sort;
    const data = this.filteredDepartments.slice();

    if (!sort.active || sort.direction === '') {
      this.filteredDepartments = data;
      return;
    }

    this.filteredDepartments = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'department':
          return compare(a.departmentName, b.departmentName, isAsc);
        case 'progress':
          return compare(a.percentage, b.percentage, isAsc);
        case 'captured':
          return compare(a.captured, b.captured, isAsc);
        case 'pending':
          return compare(a.pending, b.pending, isAsc);
        case 'total':
          return compare(a.total, b.total, isAsc);
        default:
          return 0;
      }
    });
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Progreso por departamento');

    worksheet.addRow(['Departamento', 'Nombre corto', 'Progreso (%)', 'Capturados', 'Pendientes', 'Total']);

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

    this.filteredDepartments.forEach((dept) => {
      worksheet.addRow([
        dept.departmentName,
        dept.departmentShortName,
        dept.percentage,
        dept.captured,
        dept.pending,
        dept.total
      ]);
    });

    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `Progreso_Departamentos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}