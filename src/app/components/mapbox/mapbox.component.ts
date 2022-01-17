import { BehaviorSubject } from 'rxjs'
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Inject, InjectionToken, Input, OnDestroy, OnInit, Optional, Output, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core'
import { Mapbox, MapboxViewApi, MapStyle } from '@nativescript-community/ui-mapbox'
import * as geolocation from '@nativescript/geolocation'
import { registerElement } from "@nativescript/angular";
import { EventsService } from '../../services/events.service'
import { SettingsService } from '../../services/settings.service'

export const MAPBOX_API_KEY = new InjectionToken('MapboxApiKey');
registerElement("MapboxView", () => require("@nativescript-community/ui-mapbox").MapboxView);

@Component({
  selector: 'Mapbox',
  templateUrl: './mapbox.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapboxComponent implements OnInit {

  @Input() enableLocationRequest = true;
  @Input() accessToken?: string;
  @Input() delay = 10;
  @Input() mapStyle = MapStyle.STREETS;
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() zoomLevel: 0;
  @Input() showUserLocation = false;
  @Input() hideCompass = false;
  @Input() hideLogo = false;
  @Input() hideAttribution = true;
  @Input() disableZoom = false;
  @Input() disableRotation = false;
  @Input() disableScroll = false;
  @Input() disableTilt = false;

  @Output() mapReady = new EventEmitter<MapboxViewApi>();
  @Output() moveBeginEvent = new EventEmitter<any>();
  @Output() moveEndEvent = new EventEmitter<any>();
  @Output() scrollEvent = new EventEmitter<any>();
  @Output() locationPermissionGranted = new EventEmitter<MapboxViewApi>();
  @Output() locationPermissionDenied = new EventEmitter<MapboxViewApi>();


  mapboxView: MapboxViewApi = null;
  ready$ = new BehaviorSubject<boolean>(false);


  constructor(@Optional() @Inject(MAPBOX_API_KEY) accessToken: string,
              public events: EventsService, public settingsService: SettingsService) {
    this.accessToken = accessToken;
  }

  ngOnInit(): void {
    // Init your component properties here.
    console.log("mapbox onInit");

    if (this.enableLocationRequest) {
      geolocation.enableLocationRequest();
    }
  }
  /**
   * register event handlers
   *
   * @link https://github.com/NativeScript/NativeScript/issues/7954
   * @link https://github.com/NativeScript/NativeScript/issues/7867
   * TODO: not sure if still needed
   */
  registerEventHandlers() {

    // android pause/resume workaround hack

    this.events.subscribe("platform:pause", () => {
      this.nsOnPause();
    });

    this.events.subscribe("platform:exit", () => {
      this.nsOnExit();
    });

    this.events.subscribe("platform:resume", () => {
      this.nsOnResume();
    });

  }


  // -------------------------------------------------------------

  /**
  * unregister event handlers
  */

  unRegisterEventHandlers() {
    this.events.unsubscribe("platform:pause");
    this.events.unsubscribe("platform:exit");
    this.events.unsubscribe("platform:resume");
    this.events.unsubscribe("destroyMap");

    this.ready$.next(false);
  }

  /**
   * when the app is paused
   *
   * Workaround for android pause/resume crash.
   */

  async nsOnPause() {
    console.log("MapComponent::onPause()");
  }

  // --------------------------------------

  /**
  * when the app exits
  */

  nsOnExit() {
    console.log("MapComponent::onExit()");
  }

  // --------------------------------------

  /**
  * when the app is resumed
  */

  nsOnResume() {
    console.log("MapComponent::onResume()");
  }


  /**
  * Save map settings
  *
  * To support creating and destroying the map as necessary to work around issues with
  * the Mapbox Android SDK, we have to save the settings of the map so we can restore it
  * to the same state as it was when the app was paused.
  */

  async saveMapState() {

    const center = await this.mapboxView.getCenter();     // .catch( (error) => { console.error( "MapComponent:saveMapState(): unable to get map center" ); } );
    const zoom = await this.mapboxView.getZoomLevel();    // .catch( (error) => { console.error( "MapComponent:saveMapState(): unable to get map zoom" ); } );
    const viewport = await this.mapboxView.getViewport(); // .catch( (error) => { console.error( "MapComponent:saveMapState(): unable to get map viewport" ); } );

    const settings: any = {
      center,
      zoom,
      viewport
    };

    console.log("MapComponent:saveMapState(): got map settings:", settings);

    await this.settingsService.set("mapSettings", settings);

  }

  // ---------------------------------------------------------------------------------------

  /**
  * restore map settings
  *
  * When the map is recreated after a pause we return it to the settings it had when it was paused.
  */

  async restoreMapState() {

    const settings = await this.settingsService.get("mapSettings");

    console.log("MapComponent:restoreMapState(): got settings :", settings);

    if (settings) {

      console.log("MapComponent:restoreMapState(): animating camera");

      await this.mapboxView.animateCamera({
        target: {
          lat: settings.center.lat,
          lng: settings.center.lng
        },
        zoomLevel: settings.zoom, // Android
        altitude: 2000,  // iOS (meters from the ground)
        bearing: 0,    // Where the camera is pointing, 0-360 (degrees)
        tilt: 0,
        duration: 2000   // default 10000 (milliseconds)
      });

    }

    return settings;
  }

  onMapReady(event): void {

    console.log("MapComponent:onMapReady():", event.map);

    if (this.mapboxView) {
      console.error("MapComponent:onMapReady() callback called when we already have a valid mapboxView. isReady is:", this.ready$.getValue());

      return;
    }

    // this is an instance of class MapboxView

    this.mapboxView = event.map;

    this.ready$.next(true);
    this.mapReady.emit(event.map);

    console.log("MapComponent:onMapReady(): after declareReady()");

  }

  @HostListener("unloaded")
  async ngOnDestroy() {

    console.log("MapComponent:ngOnDestroy()");

    // this prevents memory leaks.
    // this.unRegisterEventHandlers();

    // if (this.mapboxView) {
    //   this.mapboxView.destroy();
    // }
  }

  onLocationPermissionGranted(event) {
    // console.log("MapComponent:onLocationPermissionGranted():", event);
    this.locationPermissionGranted.emit(event.map);
  }

  onLocationPermissionDenied(event) {
    // console.log("MapComponent:onLocationPermissionDenied():", event);
    this.locationPermissionGranted.emit(event.map);
  }

  onMoveBeginEvent(event) {
    // console.log("MapComponent:onMoveBeginEvent():", event);
    this.moveBeginEvent.emit(event.map);
  }

  onMoveEndEvent(event) {
    this.moveEndEvent.emit(event);
  }

  onScrollEvent(event) {
    // console.log("MapComponent:onScrollEvent():", event);
    this.scrollEvent.emit(event.map);
  }
}
