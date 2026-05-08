import { Component, OnInit } from '@angular/core';
import { SharedFiltersService } from 'src/app/services/shared-filters.service';
import { Department } from 'src/app/models/department.model';
import { ReportPeriodFilters } from 'src/app/models/reportPeriod.model';
import { DepartmentService } from 'src/app/services/department.service';
import { ReportPeriodService } from 'src/app/services/reportPeriod.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-shared-filters',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  templateUrl: './shared-filters.component.html',
  styleUrl: './shared-filters.component.scss'
})
export class SharedFiltersComponent implements OnInit {
  departments: Department[] = [];
  reportPeriodsInfo: ReportPeriodFilters[] = [];

  // Valores de los filtros
  selectedPeriodIds: string[] = [];
  selectedDepartmentIds: string[] = [];
  selectedSemesters: string[] = [];
  selectedYears: string[] = [];
  selectedStartDate?: Date;
  selectedEndDate?: Date;

  constructor(
    private sharedFiltersService: SharedFiltersService,
    private departmentService: DepartmentService,
    private reportPeriodService: ReportPeriodService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.loadDepartments();
    this.loadReportPeriods();

    this.sharedFiltersService.currentFilters.subscribe(filters => {
      this.selectedPeriodIds = filters.periodIds || [];
      this.selectedDepartmentIds = filters.departmentIds || [];
      this.selectedSemesters = filters.semesters || [];
      this.selectedYears = filters.years || [];
      this.selectedStartDate = filters.startDate;
      this.selectedEndDate = filters.endDate;
    });
  }

  private loadDepartments() {
    this.departmentService.getAll().subscribe({
      next: (res) => this.departments = res,
      error: () => this.snackBar.open('Error al cargar departamentos', 'Cerrar', { duration: 3000 })
    });
  }

  private loadReportPeriods() {
    this.reportPeriodService.getAllInfo().subscribe({
      next: (res) => this.reportPeriodsInfo = res,
      error: () => this.snackBar.open('Error al cargar períodos de captura', 'Cerrar', { duration: 3000 })
    });
  }

  onFilterChange() {
    this.sharedFiltersService.updateFilters({
      periodIds: this.selectedPeriodIds,
      departmentIds: this.selectedDepartmentIds,
      semesters: this.selectedSemesters,
      years: this.selectedYears,
      startDate: this.selectedStartDate,
      endDate: this.selectedEndDate,
    });
    this.sharedFiltersService.setAnyActiveFilter(
      this.selectedPeriodIds.length > 0 ||
      this.selectedDepartmentIds.length > 0 ||
      this.selectedSemesters.length > 0 ||
      this.selectedYears.length > 0 ||
      this.selectedStartDate !== undefined ||
      this.selectedEndDate !== undefined
    );
  }

  clearFilters() {
    this.selectedPeriodIds = [];
    this.selectedDepartmentIds = [];
    this.selectedSemesters = [];
    this.selectedYears = [];
    this.selectedStartDate = undefined;
    this.selectedEndDate = undefined;

    this.onFilterChange();
  }

  get activeReports(): ReportPeriodFilters[] {
    return this.reportPeriodsInfo.filter(r => (!r.isExpired && r.isActive));
  }

  get expiredReports(): ReportPeriodFilters[] {
    return this.reportPeriodsInfo.filter(r => (r.isExpired && r.isActive));
  }

  get inactiveReports(): ReportPeriodFilters[] {
    return this.reportPeriodsInfo.filter(r => !r.isActive);
  }

  get hasActiveFilters(): boolean {
    return this.selectedPeriodIds.length > 0 ||
      this.selectedDepartmentIds.length > 0 ||
      this.selectedSemesters.length > 0 ||
      this.selectedYears.length > 0 ||
      this.selectedStartDate !== undefined ||
      this.selectedEndDate !== undefined;
  }
}