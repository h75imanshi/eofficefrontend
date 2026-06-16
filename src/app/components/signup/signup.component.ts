import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule],
    
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  signupForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  // // Captcha variables
  // captchaQuestion = '';
  // captchaAnswer = 0;

  // captchaInput = '';
  // captchaError = false;
  // captchaVerified = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      fullName:        ['', [Validators.required, Validators.pattern(/^[A-Za-z ]+$/)]],
      username:        ['', [Validators.required, Validators.minLength(3),
                             Validators.pattern('^[a-zA-Z0-9_]+$')]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required,
                             Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}$')]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

   // this.generateCaptcha();
  }

  // Validator: dono passwords match honay chahiye
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const pwd = control.get('password');
    const cpwd = control.get('confirmPassword');
    if (pwd && cpwd && pwd.value !== cpwd.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // generateCaptcha(): void {
  //   const a = Math.floor(Math.random() * 9) + 1;
  //   const b = Math.floor(Math.random() * 9) + 1;
  //   const useAdd = Math.random() > 0.5;
  //
  //   if (useAdd) {
  //     this.captchaAnswer = a + b;
  //     this.captchaQuestion = `${a}  +  ${b}  =  ?`;
  //   } else {
  //     const max = Math.max(a, b), min = Math.min(a, b);
  //     this.captchaAnswer = max - min;
  //     this.captchaQuestion = `${max}  −  ${min}  =  ?`;
  //   }
  //
  //   this.captchaInput = '';
  //   this.captchaError = false;
  //   this.captchaVerified = false;
  // }

  // verifyCaptcha(): void {
  //   if (parseInt(this.captchaInput, 10) === this.captchaAnswer) {
  //     this.captchaVerified = true;
  //     this.captchaError = false;
  //   } else {
  //     // this.captchaError = true;
  //     // this.captchaVerified = false;
  //   }
  // }

  togglePassword()        { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      fullName:        this.f['fullName']?.value,
      username:        this.f['username']?.value,
      email:           this.f['email']?.value,
      password:        this.f['password']?.value,
      confirmPassword: this.f['confirmPassword']?.value
    };

    this.authService.signup(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = 'Registration successful! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage = res.message || 'Registration failed!';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Server error. Please try again.';
      }
    });
  }

  get f() { return this.signupForm.controls; }
}
