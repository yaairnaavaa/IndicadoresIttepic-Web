import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { switchMap } from 'rxjs';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, NgIf],
  templateUrl: './side-login.component.html',
  styleUrls: ['./side-login.component.scss'],
  animations: [
    trigger('shake', [
      transition('* => shake', [
        animate('500ms', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-5px)', offset: 0.1 }),
          style({ transform: 'translateX(5px)', offset: 0.2 }),
          style({ transform: 'translateX(-5px)', offset: 0.3 }),
          style({ transform: 'translateX(5px)', offset: 0.4 }),
          style({ transform: 'translateX(-5px)', offset: 0.5 }),
          style({ transform: 'translateX(5px)', offset: 0.6 }),
          style({ transform: 'translateX(-5px)', offset: 0.7 }),
          style({ transform: 'translateX(5px)', offset: 0.8 }),
          style({ transform: 'translateX(0)', offset: 1.0 }),
        ]))
      ])
    ]),
  ]
})
export class AppSideLoginComponent {
  constructor(
    private router: Router, 
    private authService: AuthService, 
    private employeeService: EmployeeService, 
    private permissionsService: PermissionsService,
    private themeService: ThemeService
  ) { 
    this.loadRememberedEmail();
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDarkTheme = isDark
    );
  }
  isDarkTheme = false;
  private themeSubscription = Subscription.EMPTY;

  shakeState = '';
  passwordFieldType: 'password' | 'text' = 'password';
  isPasswordVisible = false; 

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false)
  });

  errorMessage: string | null = null;

  ngOnInit() {
    this.loadRememberedEmail();
  }

  ngOnDestroy() {
    this.themeSubscription.unsubscribe();
  }

  loadRememberedEmail() {
    const rememberedEmail = this.authService.getRememberedEmail();
    if (rememberedEmail) {
      this.form.patchValue({
        uname: rememberedEmail,
        rememberMe: true
      });
    }
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
    this.passwordFieldType = this.isPasswordVisible ? 'text' : 'password';
  }

  get f() {
    return this.form.controls;
  }

  submit() {
    if (this.form.invalid) return;

    const credentials = {
      email: this.form.value.uname!,
      password: this.form.value.password!,
      rememberMe: this.form.value.rememberMe || false
    };

    this.authService.login(credentials).pipe(
      switchMap(() => {
        const email = credentials.email;
        return this.employeeService.getEmployeeData(email);
      })
    ).subscribe({
      next: (res: any) => {
        const employee = res.employee;
        const permissions = employee.positions?.[0]?.role?.permissions || [];
        const employeeRole = employee.positions?.[0]?.name || '';
        const employeeDepartment = employee.positions?.[0]?.ascription.name || '';
        const employeeDepartmentId = employee.positions?.[0]?.ascription._id || '';

        this.permissionsService.setNavItemsFromPermissions(permissions);
        this.employeeService.setEmployeeRole(employeeRole);
        this.employeeService.setEmployeeDepartment(employeeDepartment);
        this.employeeService.setEmployeeDepartmentId(employeeDepartmentId);
        
        this.router.navigate(['/auth/redirect']);
      },
      error: (err) => {
        this.errorMessage = 'Correo o contraseña incorrectos';
        this.shakeState = 'shake';
        setTimeout(() => this.shakeState = '', 500);
      }
    });
  }
}