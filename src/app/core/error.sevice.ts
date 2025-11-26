import { inject, Injectable } from "@angular/core";
import { ToastService } from "./toast.service";
import { HttpErrorResponse } from "@angular/common/http";
import { ServerError } from "../models/integration-models/integration.models";

@Injectable({
    providedIn: 'root'
})
export class ErrorService{
    private readonly toast = inject(ToastService)
    
    handleServerError(error: HttpErrorResponse) : void {
        if (error.status >= 400 && error.status < 500 && error.error) {
            const serverError = error.error as ServerError;
            this.toast.error(serverError.message); 
        } 

        else {
            this.toast.error('Unexpected error, try again later.');
        }
    }

}