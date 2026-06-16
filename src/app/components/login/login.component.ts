import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // =========================================================
  // TOGGLE PASSWORD
  // =========================================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginForm.value).subscribe({

      next: (res: any) => {
        this.isLoading = false;

        if (res.success) {
          localStorage.setItem('loggedUser', JSON.stringify({
            username: res.username,
            email: res.email
          }));
          localStorage.setItem('username', res.username);

          if (res.fullName) {
            localStorage.setItem('fullName', res.fullName);
          }
          if (res.email) {
            localStorage.setItem('email', res.email);
          }
          if (res.token) {
            localStorage.setItem('token', res.token);
          }

          this.successMessage = 'Login successful! Redirecting to portal...';
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 300);

} else {
          this.errorMessage = res.message || 'Invalid credentials. Please try again.';
          this.cdr.detectChanges();
        }
      },

error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid username or password.';
        } else if (err.status === 0) {
          this.errorMessage = 'Server not reachable. Please try again.';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
        this.cdr.detectChanges();
      }

    });
  }

  // =========================================================
  // GETTER
  // =========================================================

  get f() {
    return this.loginForm.controls;
  }
}