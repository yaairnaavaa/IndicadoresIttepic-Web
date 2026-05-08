import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CaptureProgressResponse } from '../models/statistics.model';
import { IndicatorData, IndicatorDataReport, IndicatorDataUnified } from '../models/indicator-data.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) { }

  /**
   * Convierte valores múltiples a formato compatible con la API
   * @param value Valor o valores a convertir
   * @returns String con valores separados por comas o undefined si no hay valor
   */
  private formatMultipleValues(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.join(',');
    return value;
  }

  getIndicatorsWithData(): Observable<IndicatorDataUnified[]> {
    return this.http.get<IndicatorDataUnified[]>(`${this.apiUrl}/indicators`, { withCredentials: true });
  }

  getPercentageCaptured(
    periodId?: string | string[],
    departmentId?: string | string[],
    semester?: string | string[],
    year?: number | number[],
    startDate?: string | Date,
    endDate?: string | Date
  ): Observable<any> {
    let params = new HttpParams();

    const periodIds = this.formatMultipleValues(periodId);
    const departmentIds = this.formatMultipleValues(departmentId);
    const semesters = this.formatMultipleValues(semester);
    const years = Array.isArray(year) ? year.join(',') : year?.toString();

    if (periodIds) {
      params = params.set('periodId', periodIds);
    }
    if (departmentIds) {
      params = params.set('departmentId', departmentIds);
    }
    if (semesters) {
      params = params.set('semester', semesters);
    }
    if (years) {
      params = params.set('year', years);
    }
    if (startDate) {
      const dateStr = startDate instanceof Date ? startDate.toISOString() : startDate;
      params = params.set('startDate', dateStr);
    }
    if (endDate) {
      const dateStr = endDate instanceof Date ? endDate.toISOString() : endDate;
      params = params.set('endDate', dateStr);
    }

    return this.http.get<any>(`${this.apiUrl}/percentage`, { params, withCredentials: true });
  }

  getLastUpdate(
    periodId?: string | string[],
    departmentId?: string | string[],
    semester?: string | string[],
    year?: number | number[],
    startDate?: string | Date,
    endDate?: string | Date
  ): Observable<IndicatorData> {
    let params = new HttpParams();

    const periodIds = this.formatMultipleValues(periodId);
    const departmentIds = this.formatMultipleValues(departmentId);
    const semesters = this.formatMultipleValues(semester);
    const years = Array.isArray(year) ? year.join(',') : year?.toString();

    if (periodIds) {
      params = params.set('periodId', periodIds);
    }
    if (departmentIds) {
      params = params.set('departmentId', departmentIds);
    }
    if (semesters) {
      params = params.set('semester', semesters);
    }
    if (years) {
      params = params.set('year', years);
    }
    if (startDate) {
      const dateStr = startDate instanceof Date ? startDate.toISOString() : startDate;
      params = params.set('startDate', dateStr);
    }
    if (endDate) {
      const dateStr = endDate instanceof Date ? endDate.toISOString() : endDate;
      params = params.set('endDate', dateStr);
    }

    return this.http.get<IndicatorData>(`${this.apiUrl}/last-update`, { params, withCredentials: true });
  }

  getCaptureProgressByDepartment(
    limit?: number,
    periodId?: string | string[],
    departmentId?: string | string[],
    semester?: string | string[],
    year?: number | number[],
    startDate?: string | Date,
    endDate?: string | Date
  ): Observable<CaptureProgressResponse> {
    let params = new HttpParams();

    const periodIds = this.formatMultipleValues(periodId);
    const departmentIds = this.formatMultipleValues(departmentId);
    const semesters = this.formatMultipleValues(semester);
    const years = Array.isArray(year) ? year.join(',') : year?.toString();

    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (periodIds) {
      params = params.set('periodId', periodIds);
    }
    if (departmentIds) {
      params = params.set('departmentId', departmentIds);
    }
    if (semesters) {
      params = params.set('semester', semesters);
    }
    if (years) {
      params = params.set('year', years);
    }
    if (startDate) {
      const dateStr = startDate instanceof Date ? startDate.toISOString() : startDate;
      params = params.set('startDate', dateStr);
    }
    if (endDate) {
      const dateStr = endDate instanceof Date ? endDate.toISOString() : endDate;
      params = params.set('endDate', dateStr);
    }

    return this.http.get<CaptureProgressResponse>(`${this.apiUrl}/capture-progress`, {
      params,
      withCredentials: true
    });
  }

  getStatisticsIndicatorData(
    periodId?: string | string[],
    departmentId?: string | string[],
    semester?: string | string[],
    year?: number | number[],
    startDate?: string | Date,
    endDate?: string | Date
  ): Observable<IndicatorDataReport[]> {
    let params = new HttpParams();

    const periodIds = this.formatMultipleValues(periodId);
    const departmentIds = this.formatMultipleValues(departmentId);
    const semesters = this.formatMultipleValues(semester);
    const years = Array.isArray(year) ? year.join(',') : year?.toString();

    if (periodIds) {
      params = params.set('periodId', periodIds);
    }
    if (departmentIds) {
      params = params.set('departmentId', departmentIds);
    }
    if (semesters) {
      params = params.set('semester', semesters);
    }
    if (years) {
      params = params.set('year', years);
    }
    if (startDate) {
      const dateStr = startDate instanceof Date ? startDate.toISOString() : startDate;
      params = params.set('startDate', dateStr);
    }
    if (endDate) {
      const dateStr = endDate instanceof Date ? endDate.toISOString() : endDate;
      params = params.set('endDate', dateStr);
    }

    return this.http.get<IndicatorDataReport[]>(`${this.apiUrl}/graphic-data`, {
      params,
      withCredentials: true
    });
  }
}