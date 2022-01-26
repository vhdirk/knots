import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule } from "@nativescript/angular";
import { PlannerBarComponent } from './planner-bar.component'
import { NodeModule } from '../node/node.module';

@NgModule({
  imports: [NativeScriptCommonModule, NodeModule],
  declarations: [PlannerBarComponent],
  exports: [PlannerBarComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlannerBarModule {
  constructor() {
  }
}


