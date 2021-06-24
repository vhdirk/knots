import { Component, OnInit } from '@angular/core'
import { Application } from '@nativescript/core'
import { MapStyle } from '@nativescript-community/ui-mapbox'
import { RadSideDrawer } from 'nativescript-ui-sidedrawer'
import { environment } from '../../environments/environment'
import { registerElement } from "@nativescript/angular";
//registerElement("Mapbox", () => MapboxView)
registerElement("Mapbox", () => require("@nativescript-community/ui-mapbox").MapboxView);


@Component({
  selector: 'Home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

  access_token = environment.mapbox_access_token;
  style = MapStyle.LIGHT;

  constructor() {
    // Use the component constructor to inject providers.
  }

  ngOnInit(): void {
    // Init your component properties here.
    console.log("onInit");

    // it seems the hasPermission return value here is always true under Android.

    // requestLocationPermissions(true, "We use this permission to show you your current location and to give you the ability to track your rides.");

    // .then((hasPermission) => {

    //   console.log("HomePageComponent:ngOnInit(): hasPermission is:", hasPermission);

    //   if (hasLocationPermissions()) {

    //     console.log("HomePageComponent:ngOnInit(): we have been granted location permissions.");

    //     this.locationPermission = true;

    //   } else {

    //     dialogs.alert({
    //       title: "Location Error",
    //       message: "This app will not be very useful without access to the current location",
    //       okButtonText: "OK",
    //     });

    //   }
    // });

  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>Application.getRootView()
    sideDrawer.showDrawer()
  }

  onMapReady(event): void {
    console.log(event);
  }

}
