import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { IndicatorDefinitionService } from 'src/app/services/indicator-definition.service';
import { TruncatePipe } from 'src/app/pipe/truncate.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Report } from 'src/app/models/report.model';
import { IndicatorTableComponent } from 'src/app/components/indicadores/indicators-table/indicators-table.component';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    TruncatePipe,
    IndicatorTableComponent
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 })),
      ]),
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
      ])
    ])
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  selector: 'app-edit-report-dialog',
  templateUrl: './edit-report-dialog.component.html',
  styleUrl: './edit-report-dialog.component.scss',
})
export class EditReportDialogComponent {
  @ViewChild(IndicatorTableComponent) indicatorTable!: IndicatorTableComponent;
  editForm: FormGroup;
  indicatorDefinitions: IndicatorDefinition[] = [];

  selectedIndicators: IndicatorDefinition[] = [];

  displayedColumns: string[] = ['select', 'key', 'name', 'departments', 'goal'];

  reportNameOptions: string[] = [
    'Indicadores Básicos',
    'Cuestionarios 911',
    'Avance de Indicadores del PTA',
    'Informe de Rendición de Cuentas',
    'Informe de Rendición de Cuentas Sexenal',
    'Otro (ingrese el nombre manualmente)'
  ];

  constructor(
    private fb: FormBuilder,
    private indicatorService: IndicatorDefinitionService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EditReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { report: Report },
  ) {

    // Determinar si el nombre del reporte está en las opciones predefinidas
    const reportName = data.report.name;
    const isPredefinedOption = this.reportNameOptions.some(option => option === reportName);

    this.editForm = this.fb.group({
      reportNameSelect: [isPredefinedOption ? reportName : this.reportNameOptions[5]], 
        customReportName: [isPredefinedOption ? '' : reportName],
        name: [reportName, Validators.required],
        description: [data.report.description || ''],
        indicatorDefinitions: [data.report.indicators, Validators.required]
    });


    // Inicializar selectedIndicators con los indicadores del reporte
    if (data.report.indicators && data.report.indicators.length > 0) {
      this.selectedIndicators = [...data.report.indicators];
    }
  }

  ngOnInit(): void {
    this.loadIndicatorDefinitions();

    this.editForm.get('reportNameSelect')?.valueChanges.subscribe(value => {
      if (value.startsWith('Otro')) {
        this.editForm.get('customReportName')?.setValidators(Validators.required);
      } else {
        this.editForm.get('customReportName')?.clearValidators();
        this.editForm.get('customReportName')?.setValue('');
        this.editForm.get('name')?.setValue(value);
      }
      this.editForm.get('customReportName')?.updateValueAndValidity();
    });

    this.editForm.get('customReportName')?.valueChanges.subscribe(value => {
      if (this.editForm.get('reportNameSelect')?.value?.startsWith('Otro')) {
        this.editForm.get('name')?.setValue(value);
      }
    });
  }

  loadIndicatorDefinitions(): void {
    this.indicatorService.getAll().subscribe({
      next: (indicators) => {
        this.indicatorDefinitions = indicators;

        // Marcar los indicadores que ya estaban seleccionados
        if (this.data.report.indicators && this.data.report.indicators.length > 0) {
          const selectedIds = this.data.report.indicators.map(i => i._id);
          this.selectedIndicators = indicators.filter(ind =>
            selectedIds.includes(ind._id)
          );
          this.editForm.get('indicatorDefinitions')?.setValue(selectedIds);
        }
      },
      error: () => {
        this.snackBar.open('Error al cargar indicadores', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  onIndicatorsSelected(indicators: IndicatorDefinition[]): void {
    this.selectedIndicators = indicators;
    this.editForm.get('indicatorDefinitions')?.setValue(this.selectedIndicators.map(i => i._id));
  }

  removeSelected(indicator: IndicatorDefinition): void {
    this.selectedIndicators = this.selectedIndicators.filter(i => i._id !== indicator._id);
    this.editForm.get('indicatorDefinitions')?.setValue(this.selectedIndicators.map(i => i._id));

    if (this.indicatorTable) {
      this.indicatorTable.toggleSelection(indicator);
    }
  }

  onSave(): void {
    if (this.editForm.invalid) return;

    const { indicatorDefinitions, ...rest } = this.editForm.value;

    const updatedReport: Report = {
      ...rest,
      _id: this.data.report._id,
      indicators: indicatorDefinitions,
      updatedAt: new Date()
    };

    this.dialogRef.close(updatedReport);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}