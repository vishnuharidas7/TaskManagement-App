import { Routes } from '@angular/router';
import { UsersComponent } from './Components/users/users.component';

export const routes: Routes = [
    {
        path: "", component:UsersComponent
    },
    {
        path: "Users", component:UsersComponent
    }
];
