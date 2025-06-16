import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { dateTimestampProvider } from 'rxjs/internal/scheduler/dateTimestampProvider';

export enum LogLevel{
Info='INFO',
Warning='WARNING',
Error='ERROR'
}

@Injectable({
  providedIn: 'root'
})
export class LoggerServiceService {

  private backendurl='https://localhost:7192/api/Logs/PostLog';

  constructor(private http:HttpClient) { }


info(message:string){
this.log(LogLevel.Info,message)
}

warn(message:string){
this.log(LogLevel.Warning,message)
}

error(message:string,error?:any){
this.log(LogLevel.Error,message,error)
}


log(level:LogLevel,message:string,error?:any){

switch(level){
  case LogLevel.Info:console.info(message) 
  break;
  case LogLevel.Warning:console.warn(message)
  break;
  case LogLevel.Error:console.error(message)
  break;
}

const Payload={
  level,
  message,
  error:error?JSON.stringify(error):'',
  timestamp:new Date().toISOString(),
  url:window.location.href
};

this.http.post(this.backendurl,Payload)
.subscribe({next:()=>{},error:err=>console.error('Faild to send log to backend',err)});
}



}



