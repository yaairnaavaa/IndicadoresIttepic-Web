import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedFiltersService {
  private filtersSubject = new BehaviorSubject<any>({
    periodIds: [],
    departmentIds: [],
    semesters: [],
    years: [],
    startDate: undefined,
    endDate: undefined,
  });

  currentFilters = this.filtersSubject.asObservable();
  private anyActiveFilter = false;

  updateFilters(newFilters: any) {
    this.filtersSubject.next(newFilters);
  }

  setAnyActiveFilter(active:boolean) {
    this.anyActiveFilter = active
  }

  getCurrentFilterValues() {
    return this.filtersSubject.value;
  }

  getAnyActiveFilter(): boolean{
    return this.anyActiveFilter;
  }
}