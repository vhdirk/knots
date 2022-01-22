import { Observable } from 'rxjs'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PlannerQuery } from '../../services/planner.query';
import { Feature, Point } from 'geojson';

@Component({
  selector: 'KnotsPathBar',
  templateUrl: './path-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathBarComponent implements OnInit {

  nodes$!: Observable<Feature<Point>[]>;

  constructor(protected plannerQuery: PlannerQuery) {

  }

  ngOnInit(): void {
    this.nodes$ = this.plannerQuery.keyNodes$ as Observable<Feature<Point>[]>;

  }
}
