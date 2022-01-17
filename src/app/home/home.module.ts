import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule, registerElement } from "@nativescript/angular";
import { HomeRoutingModule } from './home-routing.module'
import { HomeComponent } from './home.component'
import { MapboxModule } from '../components/mapbox/mapbox.module';
import { environment } from '~/environments/environment';

@NgModule({
  imports: [NativeScriptCommonModule, HomeRoutingModule, MapboxModule.withConfig({
    accessToken: environment.mapbox_access_token,
  })],
  declarations: [HomeComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HomeModule {
  constructor() {
    // registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);
  }
}


