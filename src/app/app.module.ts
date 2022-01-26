import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptModule } from '@nativescript/angular'
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular'
import { TNSFontIconModule, USE_STORE } from 'nativescript-ngx-fonticon';

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { EventsService } from './services/events.service';
import { SettingsService } from './services/settings.service';
import { NeighborhoodStore } from './services/neighborhood.store';
import { WorkerService } from './services/worker.service'
import { CommonModule } from '@angular/common'
import { MaterialDesignIcons } from './material-design-icons';
import { knownFolders } from '@nativescript/core';

@NgModule({
  bootstrap: [AppComponent],
  imports: [AppRoutingModule, CommonModule, NativeScriptModule, NativeScriptUISideDrawerModule, TNSFontIconModule.forRoot({
    'mdi': knownFolders.currentApp().getFile("fonts/material-design-icons.css").readTextSync()
  })],
  declarations: [AppComponent],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [EventsService, SettingsService,
  ]
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
