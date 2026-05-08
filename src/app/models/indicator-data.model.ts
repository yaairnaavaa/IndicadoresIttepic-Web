import { IndicatorDefinition } from './indicator-definition.model';
import { ReportPeriod } from './reportPeriod.model';
import { User } from './user.model';

export interface ChangeLog {
  date: Date;
  user: User ;
}

export interface IndicatorData {
  _id?: string;
  definition: IndicatorDefinition ;
  reportPeriod: any;
  department: any;
  value: number;
  comments?: string;
  changesLog?: ChangeLog[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IndicatorDataReport {
  _id: string;
  definition: {
    _id: string;
    key: string;
    name: string;
    goal: number;
  };
  reportPeriod: {
    _id: string;
    reportId: {
      _id: string;
      name: string;
    };
    semester: string;
    year: number;
    startDate?: string; 
    endDate?: string;   
  };
  department: {
    _id: string;
    name: string;
    shortName: string;
  };
  value: number;
}

export interface IndicatorDataUnified {
  definitionId: string;
  key: string;
  name: string;
  description: string;
  goal: number;
  report: string;
  startDate: string; 
  endDate: string;   
  periodId: string;
  periodSemester: string;
  periodYear: number;
  departmentId: string;
  departmentName: string;
  isExpired: boolean;
  dataValue: number | null;
  comments: string | null;
  changesLog: ChangeLog[];
  dataCreatedAt: string; 
  dataUpdatedAt: string; 
  status: 'Capturado' | 'Pendiente' | 'Rechazado' | string;
}