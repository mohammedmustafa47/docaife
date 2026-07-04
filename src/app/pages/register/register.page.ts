import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone:false,
})
export class RegisterPage implements OnInit {

  formData = {
    username: '',
    email:'',
    password:''
  };
  constructor(private authservice:AuthService, private router:Router) { }

  ngOnInit() {
  }

  register(){
    this.authservice.register(this.formData).subscribe({
      next: (res)=> {
        console.log('registration successful', res);
        this.router.navigate(['/login']);
      },
      error: (err)=>{
        console.log('registration failed', err);
      }
    });
  }

}
