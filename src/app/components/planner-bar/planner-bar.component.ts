import { map, Observable } from 'rxjs'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NodeItem, PlannerQuery } from '../../services/planner.query';
import { Feature, Point } from 'geojson';
import { PlannerService } from '~/app/services/planner.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';


@Component({
  selector: 'KnotsPlannerBar',
  templateUrl: './planner-bar.component.html',
  styleUrls: ['./planner-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerBarComponent implements OnInit {

  nodes$!: Observable<NodeItem[]>;

  constructor(protected plannerQuery: PlannerQuery, protected plannerService: PlannerService) {

  }

  ngOnInit(): void {
    this.nodes$ = this.plannerQuery.nodes$;

  }
}
