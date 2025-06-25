import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Users } from '../Models/users';
import { UpdatePswd } from '../Models/updatePswd';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private viewUserApiUrl = 'https://localhost:7192/api/Users/viewusers'

  private addUserApiUrl = 'https://localhost:7192/api/Users/register'

  private deleteUserApiUrl = 'https://localhost:7192/api/Users/deleteUser';

  private updateUserApiUrl = 'https://localhost:7192/api/Users/updateuser';

  private checkUserNameExists ='https://localhost:7192/api/Users/check-username?username=';

  private getUserById='https://localhost:7192/api/Users/viewusersByid';

  private updatePasswordApiUrl='https://localhost:7192/api/Users/updatePswd';

  constructor() { }

  http = inject(HttpClient)

  getAllUsers()
  {
    return this.http.get<Users[]>(this.viewUserApiUrl);
  }

  checkUsernameExists(username: string) {
    return this.http.get<boolean>(`${this.checkUserNameExists}${username}`);
  }

  addUser(data : any)
  {
    return this.http.post(this.addUserApiUrl, data);
  }

  updateUser(users: Users)
  {
    debugger
    return this.http.put(`${this.updateUserApiUrl }/${users.id}`, users);
  }

  deleteUser(id : number)
  {
    return this.http.delete(`${this.deleteUserApiUrl}/${id}`);
  }
  
  getUserbyId(id:number)
  {
    //debugger
    return this.http.get<Users>(`${this.getUserById}/${id}`);

  }
  updatepassword(pswdUpdate : UpdatePswd){
    debugger
    return this.http.put(`${this.updatePasswordApiUrl}/${pswdUpdate.id}`,pswdUpdate);
  }

}
