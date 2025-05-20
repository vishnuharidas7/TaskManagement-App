import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Users } from '../Models/users';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  //private apiUrl = 'https://localhost:7192/api/Registration/register'
  private viewUserApiUrl = 'https://localhost:7192/api/Users/viewusers'

  private addUserApiUrl = 'https://localhost:7192/api/Users/register'

  private deleteUserApiUrl = 'https://localhost:7192/api/Users';

  private updateUserApiUrl = 'https://localhost:7192/api/Users/updateuser';

  constructor() { }

  http = inject(HttpClient)

  getAllUsers()
  {
    return this.http.get<Users[]>(this.viewUserApiUrl);
  }

  addUser(data : any)
  {
    return this.http.post(this.addUserApiUrl, data);
  }

  updateUser(users: Users)
  {
    return this.http.put(`${this.updateUserApiUrl }/${users.id}`, users);
  }

  deleteUser(id : number)
  {
    return this.http.delete(`${this.deleteUserApiUrl}/${id}`);
  }

}
