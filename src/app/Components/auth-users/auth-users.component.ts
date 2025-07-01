import { Component,ErrorHandler } from '@angular/core';
import { UserAuthService } from '../../Services/user-auth.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoggerServiceService } from '../../Services/logger-service.service';


@Component({
  selector: 'app-auth-users',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth-users.component.html',
  styleUrl: './auth-users.component.css'
})
export class AuthUsersComponent {
  username = '';
  password = '';
  user?:any;
  isLoading = false;
 
  validationErrors: string[] = [];

  constructor(private authService: UserAuthService, private router: Router,private logger:LoggerServiceService,private errorHandler:ErrorHandler) {}

  ngOnInit(): void {  
    
  }

 

  loginFunction(event: Event) {
    event.preventDefault();
    if (this.isLoading) return;

    this.isLoading = true;
    this.validationErrors = [];
  
    this.authService.login({ UserName: this.username, Password: this.password }).subscribe({
      next: () => {
        const role = sessionStorage.getItem('user_role');
        console.log("User role:", role);
        // alert("Login Successfully");
        this.logger.info("UI-Login successfully");
  
        setTimeout(() => {
          this.isLoading = false;
        if (role === 'Admin') {
          this.router.navigate(['/adminDashboard']);
        } else {
          this.router.navigate(['/userDashboard']);
        }
      }, 1000);
      },
      error: (err) => {
        console.error("Login Failed:", err);
        this.logger.error("Login failed", err);
        this.isLoading = false;
        const errorMessage =
        err.error?.message === "An unexpected error occurred. Please try again later."
          ? err.error?.detail
          : err.error?.message;
    
      if (errorMessage) {
        alert("Login Failed: " + errorMessage);
      } else {
        alert("Login Failed.An unexpected error occurred");
      }
      }
    });
  }
  
   
}
