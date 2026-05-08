import { Department } from './department.model';

export interface IndicatorDefinition {
  _id?: string;
  key: string;
  name: string;
  description?: string;
  goal: number;
  departments: Department[];
  createdAt?: Date;
  updatedAt?: Date;
}
