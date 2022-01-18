import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptModule } from '@nativescript/angular'
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { EventsService } from './services/events.service';
import { SettingsService } from './services/settings.service';
import { NeighborhoodStore } from './services/neighborhood.store';
import { WorkerService } from './services/worker.service'

@NgModule({
  bootstrap: [AppComponent],
  imports: [AppRoutingModule, NativeScriptModule, NativeScriptUISideDrawerModule],
  declarations: [AppComponent],
  providers: [EventsService, SettingsService],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppModule {

  constructor(private worker: WorkerService) {
    this.worker.setup();
  }
}


// import * as platform from "platform";
// declare var GMSServices: any;

// if (platform.isIOS) {
//   GMSServices.provideAPIKey("PUT_API_KEY_HERE");
// }
