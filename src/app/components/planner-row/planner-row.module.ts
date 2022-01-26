import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule } from "@nativescript/angular";
import { PlannerRowComponent } from './planner-row.component'
import { NodeModule } from '../node/node.module';

@NgModule({
  imports: [NativeScriptCommonModule, NodeModule],
  declarations: [PlannerRowComponent],
  exports: [PlannerRowComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlannerRowModule {
  constructor() {
  }
}


