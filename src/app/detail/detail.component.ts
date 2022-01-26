import { Component, OnInit } from '@angular/core'
import { RadSideDrawer } from 'nativescript-ui-sidedrawer'
import { Application } from '@nativescript/core'
import { PlannerQuery, PlannerSegment } from '../services/planner.query'
import { PlannerService } from '../services/planner.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'KnotsDetail',
  templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit {

  segments$: Observable<PlannerSegment[]>;

  constructor(public plannerQuery: PlannerQuery,
    public plannerService: PlannerService,) {
    this.segments$ = plannerQuery.segments$;
  }

  ngOnInit(): void {
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>Application.getRootView()
    sideDrawer.showDrawer()
  }
}
