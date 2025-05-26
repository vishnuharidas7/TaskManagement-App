import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

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

  constructor() {}

  ngOnInit(): void {}
}