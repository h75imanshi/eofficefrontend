import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import 'leaflet-polylinedecorator';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PressService } from '../../services/press.service';
import * as L from 'leaflet';
import {
  PressSearchResult,
  PressFullDetail,
  SearchType
} from '../../models/press.model';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png'
});

@Component({
  selector: 'app-press-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './press-search.component.html',
  styleUrls: ['./press-search.component.scss']
})
export class PressSearchComponent implements OnInit {

  activeTab: SearchType = 'name';

  searchName = '';
  searchAppNo = '';
  searchPrinter = '';
  searchState = '';
  searchDist = '';

  states: string[] = [];
  districts: string[] = [];

  results: PressSearchResult[] = [];

  selectedPress: any = null;
  selectedKeeper: any = null;
  selectedMachine: any[] = [];
  selectedNewspapers: any[] = [];
  resultCount = 0;
  totalNewspapers = 0;
  // map class//
  map!: L.Map;
  private maps: { [key: string]: L.Map } = {};
private mapIntervals: { [key: string]: any } = {};

  distance = '';
  duration = '';
  direction = '';

  searched = false;
  loading = false;

  modalOpen = false;
  modalLoading = false;

  modalDetail: PressFullDetail | null = null;

  expandedId: string | null = null;

  constructor(
    private pressService: PressService,
    private cd: ChangeDetectorRef
  ) { }


  ngOnInit(): void {
    this.loadStates();
  }

  loadStates(): void {

    this.pressService
      .getStates()
      .subscribe({
        next: (data) => {
          this.states = data;
        },
        error: (err) => {
          console.error(err);
        }
      });

  }

  onStateChange(): void {

    this.searchDist = '';
    this.districts = [];

    this.pressService
      .getDistricts(this.searchState)
      .subscribe({
        next: (data) => {

          this.districts = [...data];

          this.cd.detectChanges();

        },
        error: (err) => {
          console.error(err);
        }
      });

  }

  switchTab(tab: SearchType): void {

    this.activeTab = tab;

    this.results = [];

    this.searched = false;

  }

  search(): void {

    if (
      this.activeTab === 'name' &&
      this.searchName.trim().length < 3
    ) {
      alert('Enter minimum 3 characters');
      return;
    }

    this.loading = true;
    this.results = [];

    let obs$;

    switch (this.activeTab) {

      case 'name':
        obs$ = this.pressService.searchByName(
          this.searchName
        );
        break;

      case 'appno':
        obs$ = this.pressService.searchByAppNo(
          this.searchAppNo
        );
        break;

      case 'printer':
        obs$ = this.pressService.searchByPrinter(
          this.searchPrinter
        );
        break;

      case 'state':
        obs$ = this.pressService.searchByState(
          this.searchState,
          this.searchDist
        );
        break;

      default:
        return;
    }

    obs$.subscribe({
      next: (data: PressSearchResult[]) => {

        console.log('======================');
        console.log('API RESPONSE => ', data);

        data.forEach((item) => {
          console.log(
            'PRESS = ' + item.pressName +
            ' | STATE = ' + item.state +
            ' | DISTRICT = ' + item.district
          );
        });

        console.log('======================');

        this.results = data;

        this.resultCount = data.length;

        this.searched = true;

        this.loading = false;

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error('Search Error => ', err);

        this.loading = false;

        this.searched = true;

        this.cd.detectChanges();

      }
    });
  }

  toggleDetail(id: string): void {

    this.expandedId =
      this.expandedId === id ? null : id;

    if (this.expandedId) {

      this.loadPressDetail(id);

      this.loadKeeperDetail(id);

      this.loadMachineDetail(id);


    }

  }


  openModal(id: string): void {

    this.modalOpen = true;

    this.modalLoading = true;

    this.pressService
      .getFullDetail(id)
      .subscribe({
        next: (data: PressFullDetail) => {

          this.modalDetail = data;

          this.modalLoading = false;

        },
        error: (err) => {

          console.error(err);

          this.modalLoading = false;

        }
      });


  }

  closeModal(): void {

    this.modalOpen = false;

    this.modalDetail = null;

  }

  loadPressDetail(id: string): void {

    this.pressService.getFullDetail(id)
      .subscribe({
        next: (data) => {
          console.log('PRESS DETAIL => ', data);

          this.selectedPress = data;

          // NEW CODE
          if (data?.pressName) {

            this.loadNewspaperDetail(
              data.pressName
            );

          }


        },
        error: (err) => {
          console.error(err);
        }
      });

  }

  loadKeeperDetail(id: string) {

    this.pressService.getKeeperDetails(id)
      .subscribe((data: any) => {

        console.log("KEEPER DATA =>", data);
        if (Array.isArray(data)) {
          this.selectedKeeper = data.length > 0 ? data[0] : null;
        } else {
          this.selectedKeeper = data;
        }

        console.log("SELECTED KEEPER =>", this.selectedKeeper);
      });
  }

  loadMachineDetail(id: string): void {

    this.selectedMachine = [];

    this.pressService
      .getMachineDetails(id)
      .subscribe({

        next: (data: any) => {

          console.log('MACHINE DATA =>', data);

          this.selectedMachine =
            Array.isArray(data) ? data : [];

          this.cd.detectChanges();

        },

        error: (err: any) => {

          console.error('MACHINE ERROR =>', err);

          this.selectedMachine = [];

        }

      });

  }
  loadNewspaperDetail(pressName: string): void {

    this.selectedNewspapers = [];

    this.pressService
      .getNewspapersByPressName(pressName)
      .subscribe({

        next: (data: any[]) => {

          console.log('NEWSPAPERS =>', data);

          this.selectedNewspapers = data;

          this.totalNewspapers = data.length;

          this.cd.detectChanges();
        },

        error: (err) => {

          console.error(
            'NEWSPAPER ERROR =>',
            err
          );

        }

      });
  }

  // loadNewspaperDetail(appNo: string): void {

  //   this.selectedNewspapers = [];

  //   this.pressService
  //     .getNewspapersByApplicationNo(appNo)
  //     .subscribe({

  //       next: (data: any) => {

  //         const newspapers = data as any[];

  //         console.log('NEWSPAPERS =>', newspapers);

  //         this.selectedNewspapers = newspapers;

  //         this.totalNewspapers = newspapers.length;

  //         this.cd.detectChanges();
  //       },

  //       error: (err) => {

  //         console.error(
  //           'NEWSPAPER ERROR =>',
  //           err
  //         );

  //       }

  //     });
  // }
  // get diresction method//
  getCompassDirection(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number
  ): string {

    const dLon =
      (toLon - fromLon) *
      Math.PI / 180;

    const y =
      Math.sin(dLon) *
      Math.cos(toLat * Math.PI / 180);

    const x =
      Math.cos(fromLat * Math.PI / 180) *
      Math.sin(toLat * Math.PI / 180) -
      Math.sin(fromLat * Math.PI / 180) *
      Math.cos(toLat * Math.PI / 180) *
      Math.cos(dLon);

    const brng =
      (
        Math.atan2(y, x) *
        180 / Math.PI +
        360
      ) % 360;

    const dirs = [
      'North',
      'North-East',
      'East',
      'South-East',
      'South',
      'South-West',
      'West',
      'North-West'
    ];

    return dirs[
      Math.round(brng / 45) % 8
    ];
  }

  // show mapped//
  showMap(pressId: string): void {

    if (!this.selectedNewspapers?.length) {
      alert('No newspaper found for this press');
      return;
    }



    console.log(
      'FIRST NEWSPAPER =>',
      this.selectedNewspapers[0]
    );

    const publicationAddress =
      this.selectedNewspapers[0]?.ppbAddress || '';

    console.log(
      'Publication Address =>',
      publicationAddress
    );

    const pressAddress = [
      this.selectedPress?.pressAddress,
      this.selectedPress?.district,
      this.selectedPress?.state,
      this.selectedPress?.pincode
    ]
      .filter(Boolean)
      .join(', ');

    console.log('Publication Address =>', publicationAddress);
    console.log('Press Address =>', pressAddress);
    console.log('selected press =>', this.selectedPress);
    let pubGeo: any = null;
    let prsGeo: any = null;

    // STEP 1
    this.pressService.getCoordinates(publicationAddress)
      .subscribe({
        next: (pub) => {

          pubGeo = pub;

          // STEP 2
          this.pressService.getCoordinates(pressAddress)
            .subscribe({
              next: (prs) => {

                prsGeo = prs;

                // ✅ IMPORTANT: fallback handling
            //  if (!pubGeo?.lat && !prsGeo?.lat) {
            //       alert("Both locations not found");
            //       return;
            //     }

                // 👉 fallback logic
                const finalPub = pubGeo?.lat ? pubGeo : { lat: 20.5937, lon: 78.9629 }; // India center
                const finalPrs = prsGeo?.lat ? prsGeo : { lat: 20.5937, lon: 78.9629 };

                this.drawMap(finalPub, finalPrs, pressId);
              },
              error: err => console.error("PRESS GEO ERROR", err)
            });

        },
        error: err => console.error("PUBLICATION GEO ERROR", err)
      });
  }
  drawMap(pub: any, prs: any, pressId: string): void {

  const pubLat = Number(pub.lat);
  const pubLon = Number(pub.lon);
  const prsLat = Number(prs.lat);
  const prsLon = Number(prs.lon);

  if (
    isNaN(pubLat) || isNaN(pubLon) ||
    isNaN(prsLat) || isNaN(prsLon)
  ) {
    alert('Invalid coordinates');
    return;
  }

  const mapContainer = document.getElementById('map-' + pressId);

  if (!mapContainer) {
    console.error('Map container NOT FOUND for:', pressId);
    return;
  }

  // ✅ REMOVE OLD MAP IF EXISTS
  if (this.maps[pressId]) {
    this.maps[pressId].remove();
    delete this.maps[pressId];
  }

  // wait DOM ready properly
  requestAnimationFrame(() => {

    const map = L.map(mapContainer).setView([pubLat, pubLon], 6);

    this.maps[pressId] = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const publication: L.LatLngTuple = [pubLat, pubLon];
    const press: L.LatLngTuple = [prsLat, prsLon];

    // distance
    const km = L.latLng(publication).distanceTo(L.latLng(press)) / 1000;
    this.distance = km.toFixed(2) + ' KM';

    // direction
    this.direction = this.getCompassDirection(
      prsLat, prsLon, pubLat, pubLon
    );

    // duration
    const avgSpeed = 40;
    const mins = Math.round((km / avgSpeed) * 60);
    this.duration = mins + ' Minutes';

    // markers
    L.marker(publication)
      .addTo(map)
      .bindPopup('<b>Place Of Publication</b>');

    L.marker(press)
      .addTo(map)
      .bindPopup('<b>Press Location</b>');

    // route line
   this.getRoute(pubLat, pubLon, prsLat, prsLon).subscribe({
  next: (res: any) => {

    const coords = res.routes[0].geometry.coordinates;

    // convert [lon, lat] → [lat, lon]
    const routeLatLng = coords.map((c: any) => [c[1], c[0]]);

    // draw real road route
    const routeLine = L.polyline(routeLatLng, {
      color: 'blue',
      weight: 5
    }).addTo(map);

    map.fitBounds(routeLine.getBounds());

    // direction arrow animation
    const decorator = (L as any).polylineDecorator(routeLine, {
      patterns: [
        {
          offset: 0,
          repeat: 50,
          symbol: (L as any).Symbol.arrowHead({
            pixelSize: 10,
            polygon: false,
            pathOptions: {
              color: 'blue',
              weight: 2
            }
          })
        }
      ]
    });

    decorator.addTo(map);

    let offset = 0;

    setInterval(() => {
      offset = (offset + 2) % 100;

      decorator.setPatterns([
        {
          offset: offset,
          repeat: 40,
          symbol: (L as any).Symbol.arrowHead({
            pixelSize: 10,
            polygon: false,
            pathOptions: {
              color: 'blue'
            }
          })
        }
      ]);

    }, 120);

  },
  error: (err: any) => {
    console.error("ROUTE ERROR", err);
  }
});

    // info control
    const infoDiv = new L.Control({ position: 'topright' });

    infoDiv.onAdd = () => {

      const div = L.DomUtil.create('div', 'map-info-box');

      div.innerHTML = `
        <div style="
          background:white;
          padding:10px;
          border-radius:8px;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          font-size:13px;
        ">
          <b>Distance:</b> ${this.distance}<br>
          <b>Direction:</b> ${this.direction}<br>
          <b>Duration:</b> ${this.duration}
        </div>
      `;

      return div;
    };

    infoDiv.addTo(map);

    // auto fit
    map.fitBounds([publication, press]);

    // IMPORTANT FIX
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    this.cd.detectChanges();
  });
}
}




