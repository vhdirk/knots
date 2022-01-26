import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptCommonModule } from '@nativescript/angular'
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
import { NodeModule } from '../components/node/node.module'

import { DetailRoutingModule } from './detail-routing.module'
import { DetailComponent } from './detail.component'
import { PlannerRowModule } from '../components/planner-row/planner-row.module';

@NgModule({
  imports: [NativeScriptCommonModule, DetailRoutingModule, NodeModule, PlannerRowModule, TNSFontIconModule],
  declarations: [DetailComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class DetailModule { }
