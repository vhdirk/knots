import { ModuleWithProviders, NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule } from "@nativescript/angular";
import { MapboxComponent, MAPBOX_API_KEY } from './mapbox.component'

@NgModule({
  imports: [NativeScriptCommonModule],
  declarations: [MapboxComponent],
  schemas: [NO_ERRORS_SCHEMA],
  exports: [MapboxComponent],
})
export class MapboxModule {
  constructor() {}

  static withConfig(config: {
    accessToken: string;
    // geocoderAccessToken?: string;
  }): ModuleWithProviders<MapboxModule> {
    return {
      ngModule: MapboxModule,
      providers: [
        {
          provide: MAPBOX_API_KEY,
          useValue: config.accessToken,
        },
        // {
        //   provide: MAPBOX_GEOCODER_API_KEY,
        //   useValue: config.geocoderAccessToken || config.accessToken,
        // },
      ],
    };
  }
}
