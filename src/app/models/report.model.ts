import { IndicatorDefinition } from "./indicator-definition.model";

export interface Report {
  _id?: string;
  name: string;
  description?: string;
  indicators: IndicatorDefinition[];
  createdAt?: Date;
  updatedAt?: Date;
}