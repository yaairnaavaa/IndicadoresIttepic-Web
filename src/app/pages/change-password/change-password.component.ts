import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-change-password-component',
  imports: [MaterialModule, ReactiveFormsModule, NgIf],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 })),
      ]),
    ])
  ],
  standalone: true,
  templateUrl: './change-password.component.html',
})

export class ChangePasswordComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  passwordFieldType: 'password' | 'text' = 'password';

  showPassword() {
    this.passwordFieldType = 'text';
  }

  hidePassword() {
    this.passwordFieldType = 'password';
  }

  form = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  get f() {
    return this.form.controls;
  }

  changePassword() {

    if (this.form.invalid) return;

    const currentPassword = this.form.value.currentPassword || '';
    const newPassword = this.form.value.newPassword || '';
    const confirmPassword = this.form.value.confirmPassword || '';


    if (newPassword !== confirmPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-error'],
        // horizontalPosition: 'right', 
        // verticalPosition: 'top',
      });
      return;
    }

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success'],
          // horizontalPosition: 'right', 
          // verticalPosition: 'top',
        });
        this.form.reset();
        this.router.navigate(['/change-password']);
      },
      error: (err) => {
        this.snackBar.open('Error al cambiar la contraseña', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error'],
          // horizontalPosition: 'right', 
          // verticalPosition: 'top',
        });
        // console.error(err);
      },
    });
  }
}
