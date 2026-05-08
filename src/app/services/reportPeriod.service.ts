import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportPeriod, ReportPeriodFilters } from '../models/reportPeriod.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportPeriodService {
  private apiUrl = `${environment.apiUrl}/report-periods`;

  constructor(private http: HttpClient) {}

  create(data: ReportPeriod): Observable<ReportPeriod> {
    return this.http.post<ReportPeriod>(`${this.apiUrl}/`, data, { withCredentials: true });
  }

  getAll(): Observable<ReportPeriod[]> {
    return this.http.get<ReportPeriod[]>(`${this.apiUrl}/all`, { withCredentials: true });
  }

  getAllByDepartment(departmentId: string): Observable<ReportPeriod[]> {
    return this.http.get<ReportPeriod[]>(`${this.apiUrl}/all-by-department/${departmentId}`, { withCredentials: true });
  }

  getAllWithCapturedIndicators(): Observable<ReportPeriod[]> {
    return this.http.get<ReportPeriod[]>(`${this.apiUrl}/all-with-data-captured`, { withCredentials: true });
  }

  getAllWithCapturedIndicatorsByDepartment(departmentId: string): Observable<ReportPeriod[]> {
    return this.http.get<ReportPeriod[]>(`${this.apiUrl}/all-with-data-captured-by-department/${departmentId}`, { withCredentials: true });
  }

  getAllNoExpired(): Observable<ReportPeriod[]> {
    return this.http.get<ReportPeriod[]>(`${this.apiUrl}/all-no-expired`, { withCredentials: true });
  }

  getAllInfoNoExpired(): Observable<ReportPeriodFilters[]> {
    return this.http.get<ReportPeriodFilters[]>(`${this.apiUrl}/all-info-no-expired`, { withCredentials: true });
  }

  getAllInfo(): Observable<ReportPeriodFilters[]> {
    return this.http.get<ReportPeriodFilters[]>(`${this.apiUrl}/all-info`, { withCredentials: true });
  }

  getAllNoExpiredByDepartment(departmentId: string): Observable<ReportPeriod[]> {
    return this.http.get<ReportPeriod[]>(`${this.apiUrl}/all-no-expired-by-department/${departmentId}`, { withCredentials: true });
  }
  
  getById(id: string): Observable<ReportPeriod> {
    return this.http.get<ReportPeriod>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  update(id: string, data: Partial<ReportPeriod>): Observable<ReportPeriod> {
    return this.http.put<ReportPeriod>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }
}