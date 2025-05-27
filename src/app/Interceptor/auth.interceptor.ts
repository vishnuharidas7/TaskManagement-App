import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtToken=getJwtToken();
  console.log("Attaching token",jwtToken)
  if(jwtToken){
    //debugger
   var cloned= req.clone({
      setHeaders:{
        Authorization:`Bearer ${jwtToken}`,
      },
    });
    return next(cloned);
  }
  return next(req);
};

function getJwtToken():string | null{
  let tokens=sessionStorage.getItem('JWT_TOKEN');
  if(!tokens) return null;
  const token=JSON.parse(tokens).accessToken;
  return token;
}
