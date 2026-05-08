import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IndicatorDefinition } from '../models/indicator-definition.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IndicatorDefinitionService {
  private apiUrl = `${environment.apiUrl}/indicators-definition`; 

  constructor(private http: HttpClient) {}

  create(data: IndicatorDefinition): Observable<IndicatorDefinition> {
    return this.http.post<IndicatorDefinition>(`${this.apiUrl}/`, data, { withCredentials: true });
  }

  getAll(): Observable<IndicatorDefinition[]> {
    return this.http.get<IndicatorDefinition[]>(`${this.apiUrl}/all`, { withCredentials: true });
  }

  getById(id: string): Observable<IndicatorDefinition> {
    return this.http.get<IndicatorDefinition>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  getByDepartments(departmentIds: string[]): Observable<IndicatorDefinition[]> {
    return this.http.post<IndicatorDefinition[]>(`${this.apiUrl}/departments`,departmentIds, { withCredentials: true });
  }

  update(id: string, data: Partial<IndicatorDefinition>): Observable<IndicatorDefinition> {
    return this.http.put<IndicatorDefinition>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }

  bulkCreate(definitions: IndicatorDefinition[]): Observable<IndicatorDefinition[]> {
    return this.http.post<IndicatorDefinition[]>(`${this.apiUrl}/bulk`, definitions, { withCredentials: true });
  }

  checkExistingKeys(keys: string[]): Observable<IndicatorDefinition[]> {
    return this.http.post<IndicatorDefinition[]>(`${this.apiUrl}/check-existing`, { keys }, { withCredentials: true });
  }

}