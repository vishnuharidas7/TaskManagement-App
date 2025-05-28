import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserAuthService } from '../../Services/user-auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  stats = [
    { title: 'Total Tasks', count: 120 },
    { title: 'Completed Tasks', count: 80 },
    { title: 'Pending Tasks', count: 40 },
    { title: 'Total Users', count: 25 }
  ];

  taskList = [
    { title: 'Design Homepage', status: 'In Progress', assignedTo: 'John', dueDate: new Date() },
    { title: 'Database Backup', status: 'Completed', assignedTo: 'Alice', dueDate: new Date() },
    { title: 'Bug Fixes', status: 'Pending', assignedTo: 'Mike', dueDate: new Date() }
  ];

  
  user?:any
  constructor(private authService: UserAuthService) {
    // this.authService.getCurrentAuthUser().subscribe((r)=>{
    //   console.log(r);
    //   this.user=r;

    // });

  }

  ngOnInit() {
    // const tokens = sessionStorage.getItem('JWT_TOKEN');
    // if (tokens) {
    //   const parsedTokens = JSON.parse(tokens);
    //   const accessToken = parsedTokens.accessToken;
    //   const refreshToken = parsedTokens.refreshToken;
  
    //   if (accessToken && refreshToken) {
    //     this.authService.startRefreshTokenTimer(accessToken, refreshToken);
    //   }
    // }
  }
  

  logout(){
    this.authService.logout();
  }
}