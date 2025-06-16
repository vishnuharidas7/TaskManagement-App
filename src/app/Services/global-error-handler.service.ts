import { Injectable,ErrorHandler,Injector } from '@angular/core';
import { LoggerServiceService } from './logger-service.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler{

  constructor(private injector:Injector) { }
  handleError(error: any): void {
    const logger=this.injector.get(LoggerServiceService);
    logger.error('Un-handeled front end Global error',error);
    console.error('Un-handeled error',error);
  }
}
