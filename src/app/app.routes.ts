import { Routes } from '@angular/router';
import { UsersComponent } from './Components/users/users.component';
import { AdminDashboardComponent } from './Components/admin-dashboard/admin-dashboard.component';
import { AdminTaskRegisterComponent } from './Components/admin-task-register/admin-task-register.component';

export const routes: Routes = [
    {
        path: "", redirectTo: 'adminDashboard', pathMatch: 'full'
    },
    {
        path: "users", component:UsersComponent
    },
    { 
        path: 'adminDashboard', component: AdminDashboardComponent
    },
    {
        path: 'adminTask', component: AdminTaskRegisterComponent
    }

];

