import { Routes } from '@angular/router';
import { UsersComponent } from './Components/users/users.component';
import { AdminDashboardComponent } from './Components/admin-dashboard/admin-dashboard.component';
import { AdminTaskRegisterComponent } from './Components/admin-task-register/admin-task-register.component';
import { AuthUsersComponent } from './Components/auth-users/auth-users.component';
import { authGuard } from './Guard/auth.guard';
import { UserDashboardComponent } from './Components/user-dashboard/user-dashboard.component';
import { ForgotPasswordComponent } from './Components/forgot-password/forgot-password.component';


export const routes: Routes = [

    {
        path:'login',component:AuthUsersComponent
    
    },
    {
        path: '',redirectTo: 'login', pathMatch: 'full'
    },
    {
        path: 'users', component:UsersComponent,  canActivate: [authGuard]
    },
    { 
        path: 'adminDashboard', component: AdminDashboardComponent,  canActivate: [authGuard(['Admin'])]
    },
    {
        path: 'userDashboard', component: UserDashboardComponent,  canActivate: [authGuard(['User'])]
    },
    {
        path: 'adminTask', component: AdminTaskRegisterComponent,  canActivate: [authGuard]
    },
    {
        path: 'forgotpassword', component:ForgotPasswordComponent
    }


];

