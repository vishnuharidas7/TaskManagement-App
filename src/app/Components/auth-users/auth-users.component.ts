import { Component } from '@angular/core';
import { UserAuthService } from '../../Services/user-auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-auth-users',
  imports: [FormsModule],
  templateUrl: './auth-users.component.html',
  styleUrl: './auth-users.component.css'
})
export class AuthUsersComponent {
  username = '';
  password = '';
  user?:any;
 
  validationErrors: string[] = [];

  constructor(private authService: UserAuthService, private router: Router) {}

  ngOnInit(): void {  
    
  }

  loginFunction(event:Event) {
    event.preventDefault();
    this.validationErrors = [];

    if(this.authService.isTokenExpired()){

      this.authService.refreshToken()?.subscribe({
        next:()=>{
          this.authService.login({ UserName: this.username, Password: this.password }).subscribe(()=>{
            alert("Login Succesfully");
           this.router.navigate(['/']);
           });
        },
        error:(err)=>{
          alert('Token refresh failed. Please log in again.')
          this.router.navigate(['/login']);
        }
      });
    }
    else{
        this.authService.login({ UserName: this.username, Password: this.password }).subscribe({
          next:()=>{
            alert("Login Succesfully");
            this.router.navigate(['/']);
          },
          error:(err)=>{
            if(err.error?.message){
              alert("Login Failed: " + err.error.message);
            }else{
              alert("Login Failed. Please check your username and password.");
            }
          }       
        });
    }

  }
   
}
