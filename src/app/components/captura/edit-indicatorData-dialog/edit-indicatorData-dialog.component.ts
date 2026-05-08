import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { IndicatorData } from 'src/app/models/indicator-data.model';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  selector: 'app-edit-indicatorData-dialog',
  templateUrl: './edit-indicatorData-dialog.component.html',
})
export class EditIndicatorDataDialogComponent {
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditIndicatorDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { indicatorData: IndicatorData },
  ) {

    this.editForm = this.fb.group({
      value: [data.indicatorData.value, [Validators.required, Validators.min(0)]],
    });

  }

  onSave(): void {
    if (this.editForm.invalid) return;

    const updatedData: Partial<IndicatorData> = {
      _id: this.data.indicatorData._id,
      value: this.editForm.value.value,
    };

    this.dialogRef.close(updatedData);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}