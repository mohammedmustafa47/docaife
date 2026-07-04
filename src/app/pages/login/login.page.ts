import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false,
})
export class LoginPage implements OnInit {
  LoginData = {
    email:'',
    password:''
  }

  isLoading = false;
  errorMessage = '';

  constructor(private authservice: AuthService,private router:Router) { }

  ngOnInit() {
    this.errorMessage = '';
  }

  login(){

    if (!this.LoginData.email || !this.LoginData.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    console.log(this.LoginData);
    this.authservice.login(this.LoginData).subscribe({
    next: (res) => {
      console.log("Login Success", res);
      this.router.navigate(['/layout']);

      this.authservice.getProfile().subscribe({
          next: (profile) => {
            console.log('✅ Profile loaded:', profile);
            this.isLoading = false;
            
            // ✅ Navigate to home
            this.router.navigate(['/layout']);
          },
          error: (err) => {
            console.error('❌ Failed to load profile:', err);
            this.isLoading = false;
            
            // ✅ Still navigate even if profile fails
            this.router.navigate(['/layout']);
          }
        });
    },
    error: (err) => {
      console.log("Login Failed", err);
      this.isLoading = false;

      if (err.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (err.status === 0) {
          this.errorMessage = 'Cannot connect to server';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
    }
  });
  }

}
