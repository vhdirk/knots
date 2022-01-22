import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule } from "@nativescript/angular";
import { PathBarComponent } from './path-bar.component'

@NgModule({
  imports: [NativeScriptCommonModule],
  declarations: [PathBarComponent],
  exports: [PathBarComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PathBarModule {
  constructor() {
  }
}


