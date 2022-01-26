import { ChangeDetectionStrategy, Component, Input, NgZone, OnInit } from '@angular/core';
import { PlannerQuery } from '../../services/planner.query';
import { Feature, Point } from 'geojson';
import { EventData, isAndroid, Label } from '@nativescript/core';

@Component({
  selector: 'KnotsNode',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeComponent implements OnInit {

  @Input() node!: Feature<Point>
  @Input() isKeyNode = false;

  constructor(private zone: NgZone ) {

  }

  ngOnInit(): void {

  }

  onLabelLoaded(args: EventData) {
    this.zone.run(() => {
      const lbl = args.object as Label;
      if (isAndroid) {
        lbl.android.setGravity(17)
      }
    })
  }
}
