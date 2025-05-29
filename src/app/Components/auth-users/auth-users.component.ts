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

  // loginFunction(event:Event) {
  //   debugger
  //   event.preventDefault();
  //   this.validationErrors = [];

  //   if(this.authService.isTokenExpired()){
  //     this.authService.refreshToken()?.subscribe({
  //       next:()=>{
  //         this.authService.login({ UserName: this.username, Password: this.password }).subscribe(()=>{
  //          // debugger
  //           const role = sessionStorage.getItem('user_role');
  //           if(role === 'Admin'){
  //             this.router.navigate(['/adminDashboard']);
  //           }
  //           else{
  //             this.router.navigate(['/userDashboard']);
  //           }
  //           alert("Login Succesfully");
           
  //          });
  //       },
  //       error:(err)=>{
  //         console.error("Login Failed",err);
  //         alert('Login failed. Please check your credentials.')
  //         this.router.navigate(['/login']);
  //       }
  //     });
  //   }
  //   else{
  //       this.authService.login({ UserName: this.username, Password: this.password }).subscribe({
  //         next:()=>{
  //           const role = localStorage.getItem('user_role');
  //           if(role === '1'){
  //             this.router.navigate(['/adminDashboard']);
  //           }
  //           else{
  //             this.router.navigate(['/userDashboard']);
  //           }
  //           alert("Login Succesfully");
  //           // alert("Login Succesfully");
  //           // this.router.navigate(['/']);
  //         },
  //         error:(err)=>{
  //           if(err.error?.message){
  //             alert("Login Failed: " + err.error.message);
  //           }else{
  //             alert("Login Failed. Please check your username and password.");
  //           }
  //         }       
  //       });
  //   }

  // }

  loginFunction(event: Event) {
    event.preventDefault();
    this.validationErrors = [];
  
    this.authService.login({ UserName: this.username, Password: this.password }).subscribe({
      next: () => {
        const role = sessionStorage.getItem('user_role');
        console.log("User role:", role);
  
        alert("Login Successfully");
  
        if (role === 'Admin') {
          this.router.navigate(['/adminDashboard']);
        } else {
          this.router.navigate(['/userDashboard']);
        }
      },
      error: (err) => {
        console.error("Login Failed:", err);
        if (err.error?.message) {
          alert("Login Failed: " + err.error.message);
        } else {
          alert("Login Failed. Please check your credentials.");
        }
      }
    });
  }
  
   
}
