// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { enableProdMode, NgModuleRef } from '@angular/core';
import { runNativeScriptAngularApp, platformNativeScript } from '@nativescript/angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


if (environment.production) {
  enableProdMode();
  // enableAkitaProdMode();
}


runNativeScriptAngularApp({
  appModuleBootstrap: () => platformNativeScript().bootstrapModule(AppModule),
});


// const bootstrap = (): Promise<NgModuleRef<AppModule>> => {
//   return platformNativeScriptDynamic().bootstrapModule(AppModule, { ngZoneEventCoalescing: true });
// };


// if (environment.hmr) {
//   // eslint-disable-next-line dot-notation
//   // if ((module as any).hot) {
//   //   hmrBootstrap(module, bootstrap);
//   // } else {
//   //   console.error('HMR is not enabled for webpack-dev-server!');
//   //   console.log('Are you using the --hmr flag for ng serve?');
//   // }
// } else {
//   bootstrap()
// }
