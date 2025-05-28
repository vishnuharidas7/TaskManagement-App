import { Routes } from '@angular/router';
import { UsersComponent } from './Components/users/users.component';
import { AdminDashboardComponent } from './Components/admin-dashboard/admin-dashboard.component';
import { AdminTaskRegisterComponent } from './Components/admin-task-register/admin-task-register.component';
import { AuthUsersComponent } from './Components/auth-users/auth-users.component';
import { authGuard } from './Guard/auth.guard';
import { UserDashboardComponent } from './Components/user-dashboard/user-dashboard.component';

export const routes: Routes = [

    {
        path:'login',component:AuthUsersComponent
    
    },
    {
        //path: "", redirectTo: 'adminDashboard', pathMatch: 'full',canActivate:[authGuard]
        path: '',component: AdminDashboardComponent,canActivate:[authGuard]
    },
    {
        path: "users", component:UsersComponent
    },
    { 
        path: 'adminDashboard', component: AdminDashboardComponent
    },
    {
        path: 'userDashboard', component: UserDashboardComponent
    },
    {
        path: 'adminTask', component: AdminTaskRegisterComponent
    }

];

