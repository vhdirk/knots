import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule, registerElement } from "@nativescript/angular";
import { environment } from '~/environments/environment';
import { HomeRoutingModule } from './home-routing.module'
import { HomeComponent } from './home.component'
import { MapboxModule } from '../components/mapbox/mapbox.module';
import { PlannerBarModule } from '../components/planner-bar/planner-bar.module';
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';

@NgModule({
  imports: [NativeScriptCommonModule, HomeRoutingModule, MapboxModule.withConfig({
    accessToken: environment.mapbox_access_token,
  }), PlannerBarModule, TNSFontIconModule],
  declarations: [HomeComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HomeModule {
  constructor() {
  }
}


