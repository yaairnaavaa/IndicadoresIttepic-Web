import { Report } from "./report.model";

export interface ReportPeriod {
  _id?: string;
  index?: Number;
  reportId: Report;
  semester: string;
  year: Number;
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  isActive: boolean;
  isExpired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportPeriodFilters{
  _id?: string;
  semester: string;
  year: Number;
  reportName: string;
  isExpired: boolean;
  isActive: boolean;
}