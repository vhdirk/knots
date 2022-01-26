import { map, Observable } from 'rxjs'
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { NodeItem, PlannerQuery, PlannerSegment } from '../../services/planner.query';
import { Feature, Point } from 'geojson';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PlannerService } from '../../services/planner.service';


@Component({
  selector: 'KnotsPlannerRow',
  templateUrl: './planner-row.component.html',
  styleUrls: ['./planner-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PlannerRowComponent implements OnInit {

  @Input() segment!: PlannerSegment;

  constructor(protected plannerQuery: PlannerQuery, protected plannerService: PlannerService) {

  }

  ngOnInit(): void {

  }

  formatDistance(distance: number): string {
    return (distance/ 1000.0).toFixed(2);
  }
}
