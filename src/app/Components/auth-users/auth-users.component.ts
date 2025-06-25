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
 
  validationErrors: string[] = [];

  constructor(private authService: UserAuthService, private router: Router,private logger:LoggerServiceService,private errorHandler:ErrorHandler) {}

  ngOnInit(): void {  
    
  }

 

  loginFunction(event: Event) {
    event.preventDefault();
    this.validationErrors = [];
  
    this.authService.login({ UserName: this.username, Password: this.password }).subscribe({
      next: () => {
        const role = sessionStorage.getItem('user_role');
        console.log("User role:", role);
        alert("Login Successfully");
        this.logger.info("UI-Login successfully");
  
        if (role === 'Admin') {
          this.router.navigate(['/adminDashboard']);
        } else {
          this.router.navigate(['/userDashboard']);
        }
      },
      error: (err) => {
        console.error("Login Failed:", err);
        this.logger.error("Login failed", err)
        if (err.error?.message) {
          alert("Login Failed: " + err.error.message);
          this.errorHandler.handleError(err);
        } else {
          alert("Login Failed. Please check your credentials.");
          this.errorHandler.handleError(err);
        }
      }
    });
  }
  
   
}
