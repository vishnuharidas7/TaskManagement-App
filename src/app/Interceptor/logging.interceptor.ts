import { HttpInterceptorFn } from '@angular/common/http';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoggerServiceService } from '../Services/logger-service.service';
import { inject } from '@angular/core'; // <-- lowercase 'inject'


export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  //debugger
  // inject LoggerServiceService inside the function
  const logger = inject(LoggerServiceService);

  return next(req).pipe(
    catchError(error => {
      // error here is probably HttpErrorResponse
      logger.error('HTTP Error', {
        status: error.status,
        message: error.message,
        url: req.url
      });
      return throwError(() => error);
    })
  );
};
