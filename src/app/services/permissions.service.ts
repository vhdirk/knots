import { Observable, of as observableOf, from as observableFrom } from "rxjs";
import { Injectable } from "@angular/core";
import { hasPermission, requestPermission } from "nativescript-permissions";

export { PERMISSIONS} from "nativescript-permissions";

@Injectable({
  providedIn: "root"
})
export class PermissionsService {

  constructor() { }


  hasPermission(permission: string): boolean {
    return hasPermission(permission);
  }

  requestPermission(permission: string, explanation: string): Observable<boolean> {
    if (this.hasPermission(permission)) {
      console.log("hasPermission", permission);
      return observableOf(true);
    }

    return observableFrom(requestPermission(permission, explanation));
  }

}
