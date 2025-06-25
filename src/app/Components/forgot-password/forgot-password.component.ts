import { Component } from '@angular/core'; 
import { UserAuthService } from '../../Services/user-auth.service';  
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';




@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})

export class ForgotPasswordComponent {

  email: string = '';

  constructor(private authService: UserAuthService) {}

  submitForgotPassword() {
    if (!this.email) return;

    this.authService.sendForgotPasswordEmail(this.email).subscribe({
      next: () => alert('New password will be sent if email is valid.'),
      // error: err => alert('Error: ' + err.error.message)
      error: err => {
    const errorMsg = err.error && err.error.Error 
      ? err.error.Error 
      : 'Unknown error occurred';
    alert('Error: ' + errorMsg);
  }
    });
  }

}

