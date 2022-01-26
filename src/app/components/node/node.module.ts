import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule } from "@nativescript/angular";
import { NodeComponent } from './node.component'

@NgModule({
  imports: [NativeScriptCommonModule],
  declarations: [NodeComponent],
  exports: [NodeComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class NodeModule {
}


