import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IndicatorData } from '../models/indicator-data.model';
import { Observable } from 'rxjs';
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class IndicatorDataService {
  private apiUrl = `${environment.apiUrl}/indicators-data`;

  constructor(private http: HttpClient) {}

  create(data: IndicatorData): Observable<IndicatorData> {
    return this.http.post<IndicatorData>(`${this.apiUrl}/`, data, { withCredentials: true });
  }

  getAll(): Observable<IndicatorData[]> {
    return this.http.get<IndicatorData[]>(`${this.apiUrl}/all`, { withCredentials: true });
  }

  getByDefinition(definitionId: string): Observable<IndicatorData[]> {
    return this.http.get<IndicatorData[]>(`${this.apiUrl}/by-definition/${definitionId}`, { withCredentials: true });
  }

  getByDepartment(departmentId: string): Observable<IndicatorData[]> {
    return this.http.get<IndicatorData[]>(`${this.apiUrl}/by-department/${departmentId}`, { withCredentials: true });
  }

  getByReportPeriod(reportPeriodId: string): Observable<IndicatorData[]> {
    return this.http.get<IndicatorData[]>(`${this.apiUrl}/by-report-period/${reportPeriodId}`, { withCredentials: true });
  }

  getByReportPeriodAndDepartment(reportPeriodId: string, departmentId: string): Observable<IndicatorData[]> {
    return this.http.get<IndicatorData[]>(`${this.apiUrl}/by-report-period/${reportPeriodId}/department/${departmentId}`, { withCredentials: true });
  }

  update(id: string, data: Partial<IndicatorData>): Observable<IndicatorData> {
    return this.http.put<IndicatorData>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }

}
