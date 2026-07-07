import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { from } from 'rxjs';
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
import { HttpClient } from '@angular/common/http';

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

  private animationIntervals: { [key: string]: any } = {};

  distance: string = '';
  duration: string = '';
  direction: string = '';
  maps: { [key: string]: L.Map } = {};

  searched = false;
  loading = false;

  modalOpen = false;
  modalLoading = false;

  modalDetail: PressFullDetail | null = null;

  expandedId: string | null = null;
  // ===========================================
  // NAYA STATE — multiple newspaper map ke liye
  // ===========================================
  mapLoading: { [key: string]: boolean } = {};
  failedAddresses: { [key: string]: string[] } = {};   // pressId -> list of newspaper names jinka geocode fail hua
  mapSummary: { [key: string]: { total: number; plotted: number; failed: number } } = {};

  constructor(
    private http: HttpClient,
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

  // get driving route from public OSRM service
  getRoute(fromLat: number, fromLon: number, toLat: number, toLon: number) {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
    return from(fetch(url).then(res => res.json()));
  }


  // ===========================================
  // Helper: address string banata hai kisi bhi
  // press/newspaper row ke fields se
  // ===========================================
  private buildPressAddress(): string {
    return [
      this.selectedPress?.pressAddress,
      this.selectedPress?.district,
      this.selectedPress?.state,
      this.selectedPress?.pincode
    ]
      .filter(Boolean)
      .join(', ');
  }

  // ===========================================
  // Helper: chhota delay, Nominatim/OSRM rate
  // limit (1 req/sec) se bachne ke liye sequential
  // geocoding karte waqt
  // ===========================================
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  // show mapped//
  showMap(pressId: string): void | Promise<void> {

    if (!this.selectedNewspapers?.length) {
      alert('No newspaper found for this press');
      return;
    }

    console.log('FIRST NEWSPAPER =>', this.selectedNewspapers[0]);

    const publicationAddress = this.selectedNewspapers[0]?.ppbAddress || '';

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

    if (!publicationAddress || !pressAddress) {
      alert('Publication ya Press address missing hai, map nahi dikha sakte');
      return;
    }

    let pubGeo: any = null;
    let prsGeo: any = null;

    // STEP 1: Publication address geocode
    this.pressService.getCoordinates(publicationAddress).subscribe({
      next: (pub: any) => {

        console.log('PUBLICATION GEO =>', pub);

        pubGeo = pub;

        // STEP 2: Press address geocode
        this.pressService.getCoordinates(pressAddress).subscribe({
          next: (prs: any) => {
            console.log('PRESS GEO =>', prs);



            prsGeo = prs;

            // FIX: Yeh check UNCOMMENT kiya gaya hai. Agar dono fail
            // ho jayen, user ko clearly bata do - silently India
            // center pe map mat dikhao, isse user confuse hota hai.
            if (!pubGeo?.lat && !prsGeo?.lat) {
              alert('Dono addresses ki location nahi mil payi. Address format check karo.');
              return;
            }

            // Agar sirf ek geocode fail hua ho, dusre ko duplicate kar do
            // taaki kam se kam ek valid point dikhe (dono ek jagah honge,
            // par yeh better hai poore India center jaane se)
            const finalPub = pubGeo?.lat ? pubGeo : prsGeo;
            const finalPrs = prsGeo?.lat ? prsGeo : pubGeo;

            if (!pubGeo?.lat) {
              console.warn('Publication address geocode FAILED, press location use kar rahe hain fallback ke liye');
            }
            if (!prsGeo?.lat) {
              console.warn('Press address geocode FAILED, publication location use kar rahe hain fallback ke liye');
            }

            
            this.drawMultipleLocationMap(finalPub, finalPrs, pressId);
          },
          error: (err: any) => {
            console.error('PRESS GEO ERROR', err);
            alert('Press address ki location fetch karne me error aaya');
          }
        });

      },
      error: (err: any) => {
        console.error('PUBLICATION GEO ERROR', err);
        alert('Publication address ki location fetch karne me error aaya');
      }
    });
  }

  // ===========================================
  // DRAW MAP
  // ===========================================
  // Compatibility wrapper used when two geocodes (publication + press)
  // are available but caller doesn't have a pressId handy.
  drawMultipleLocationMapCompat(pub: any, prs: any): void {
    const pressId = this.selectedPress?.pressId || this.selectedPress?.id || 'multi';
    this.drawMultipleLocationMap(pub, prs, pressId);
  }

  drawMultipleLocationMap(pub: any, prs: any, pressId: string): void {

    const pubLat = Number(pub.lat);
    const pubLon = Number(pub.lon);
    const prsLat = Number(prs.lat);
    const prsLon = Number(prs.lon);

    if (isNaN(pubLat) || isNaN(pubLon) || isNaN(prsLat) || isNaN(prsLon)) {
      alert('Invalid coordinates');
      return;
    }

    const mapContainer = document.getElementById('map-' + pressId);

    if (!mapContainer) {
      console.error('Map container NOT FOUND for:', pressId);
      return;
    }

    // Purana map hatao agar already bana hua hai
    if (this.maps[pressId]) {
      this.maps[pressId].remove();
      delete this.maps[pressId];
    }

    // FIX: purana animation interval bhi clear karo, warna purane
    // intervals zinda rehte hain aur naye ke saath overlap karte hain
    if (this.animationIntervals[pressId]) {
      clearInterval(this.animationIntervals[pressId]);
      delete this.animationIntervals[pressId];
    }

    requestAnimationFrame(() => {

      const map = L.map(mapContainer).setView([pubLat, pubLon], 6);

      this.maps[pressId] = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      const publication: L.LatLngTuple = [pubLat, pubLon];
      const press: L.LatLngTuple = [prsLat, prsLon];

      // Distance (straight-line)
      // const km = L.latLng(publication).distanceTo(L.latLng(press)) / 1000;
      // this.distance = km.toFixed(2) + ' KM';

      // // Direction
      // this.direction = this.getCompassDirection(prsLat, prsLon, pubLat, pubLon);

      // // Duration (estimate, average speed 40 km/h)
      // const avgSpeed = 40;
      // const mins = Math.round((km / avgSpeed) * 60);
      // this.duration = mins + ' Minutes';


      // Direction


      next: (res: any) => {

        if (!res?.routes?.length) {
          return;
        }

        const route = res.routes[0];
        console.log('ROUTE =>', res.routes[0]);


        this.distance =
          (route.distance / 1000).toFixed(2) + ' KM';

        this.duration =
          Math.round(route.duration / 60) + ' Minutes';

        this.direction =
          this.getCompassDirection(
            prsLat,
            prsLon,
            pubLat,
            pubLon
          );

        console.log('DISTANCE =>', this.distance);
        console.log('DURATION =>', this.duration);
        console.log('DIRECTION =>', this.direction);


        this.cd.detectChanges();

      }

      // Default values jab tak OSRM response nahi aata
      this.distance = 'Loading...';
      this.duration = 'Loading...';

      // Markers
      L.marker(publication).addTo(map).bindPopup('<b>Place Of Publication</b>');
      L.marker(press).addTo(map).bindPopup('<b>Press Location</b>');



      // FIX: getRoute() ab COMPONENT ka method hai (4 numbers leta hai),
      // service ka clashing getRoute(url) hata diya gaya hai
      this.getRoute(pubLat, pubLon, prsLat, prsLon).subscribe({
        // next: (res: any) => {
        //   console.log('OSRM RESPONSE =>', res);

        //   // FIX: agar OSRM ne valid route nahi diya, crash hone se bachao
        //   if (!res?.routes?.length) {
        //     console.warn('OSRM se route nahi mila, sirf markers dikhayenge');
        //     map.fitBounds([publication, press]);
        //     return;
        //   }

        //   const coords = res.routes[0].geometry.coordinates;
        //   const routeLatLng = coords.map((c: any) => [c[1], c[0]]);

        //   const routeLine = L.polyline(routeLatLng, {
        //     color: 'blue',
        //     weight: 5
        //   }).addTo(map);

        //   map.fitBounds(routeLine.getBounds());

        //   // Direction arrow animation
        //   try {
        //     const decorator = (L as any).polylineDecorator(routeLine, {
        //       patterns: [
        //         {
        //           offset: 0,
        //           repeat: 50,
        //           symbol: (L as any).Symbol.arrowHead({
        //             pixelSize: 10,
        //             polygon: false,
        //             pathOptions: { color: 'blue', weight: 2 }
        //           })
        //         }
        //       ]
        //     });

        //     decorator.addTo(map);

        //     let offset = 0;

        //     // FIX: interval ID store kiya gaya hai taaki future me clear kar sakein
        //     this.animationIntervals[pressId] = setInterval(() => {
        //       offset = (offset + 2) % 100;

        //       decorator.setPatterns([
        //         {
        //           offset: offset,
        //           repeat: 40,
        //           symbol: (L as any).Symbol.arrowHead({
        //             pixelSize: 10,
        //             polygon: false,
        //             pathOptions: { color: 'blue' }
        //           })
        //         }
        //       ]);
        //     }, 120);

        // } catch (decoratorErr) {
        //   // FIX: agar polylineDecorator kisi wajah se fail ho (plugin
        //   // load issue), route line phir bhi dikhegi, sirf animated
        //   // arrows nahi milenge - poora map crash nahi hoga
        //   console.error('Polyline decorator error (arrows nahi dikhenge, par route line dikhegi):', decoratorErr);
        // }

        //         next: (res: any) => {

        //           console.log('OSRM RESPONSE =>', res);

        //           if (!res?.routes?.length) {
        //             console.warn('OSRM se route nahi mila');
        //             map.fitBounds([publication, press]);
        //             return;
        //           }

        //           const route = res.routes[0];

        //           // ===== Road Distance =====
        //           const roadDistance = route.distance / 1000;

        //           // ===== Road Duration =====
        //           const roadDuration = route.duration / 60;

        //           this.distance =
        //             roadDistance.toFixed(2) + ' KM';

        //           this.duration =
        //             Math.round(roadDuration) + ' Minutes';
        //           infoDiv.innerHTML = `
        // <div style="
        // background:white;
        // padding:10px;
        // border-radius:8px;
        // box-shadow:0 2px 6px rgba(0,0,0,0.3);
        // font-size:13px;
        // ">
        // <b>Distance:</b> ${this.distance}<br>
        // <b>Direction:</b> ${this.direction}<br>
        // <b>Duration:</b> ${this.duration}
        // </div>

        next: (res: any) => {

          console.log('OSRM RESPONSE =>', res);

          if (!res?.routes?.length) {
            return;
          }

          const route = res.routes[0];
          console.log('OSRM Distance =>', route.distance / 1000);
          console.log('OSRM Duration =>', route.duration / 60);

          this.distance =
            (route.distance / 1000).toFixed(2) + ' KM';

          this.duration =
            Math.round(route.duration / 60) + ' Minutes';

          this.direction =
            this.getCompassDirection(
              prsLat,
              prsLon,
              pubLat,
              pubLon
            );

          console.log('DISTANCE =>', this.distance);
          console.log('DURATION =>', this.duration);
          console.log('DIRECTION =>', this.direction);

          this.cd.detectChanges();

          infoDiv.innerHTML = `
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

          console.log('ROAD DISTANCE =>', this.distance);
          console.log('ROAD DURATION =>', this.duration);

          const coords =
            route.geometry.coordinates;

          const routeLatLng =
            coords.map((c: any) => [c[1], c[0]]);

          const routeLine = L.polyline(routeLatLng, {
            color: 'blue',
            weight: 5
          }).addTo(map);

          map.fitBounds(routeLine.getBounds());

          try {

            const decorator =
              (L as any).polylineDecorator(
                routeLine,
                {
                  patterns: [
                    {
                      offset: 0,
                      repeat: 50,
                      symbol:
                        (L as any).Symbol.arrowHead({
                          pixelSize: 10,
                          polygon: false,
                          pathOptions: {
                            color: 'blue',
                            weight: 2
                          }
                        })
                    }
                  ]
                }
              );

            decorator.addTo(map);

            let offset = 0;

            this.animationIntervals[pressId] =
              setInterval(() => {

                offset = (offset + 2) % 100;

                decorator.setPatterns([
                  {
                    offset,
                    repeat: 40,
                    symbol:
                      (L as any).Symbol.arrowHead({
                        pixelSize: 10,
                        polygon: false,
                        pathOptions: {
                          color: 'blue'
                        }
                      })
                  }
                ]);

              }, 120);

          } catch (err) {

            console.error(
              'Decorator Error =>',
              err
            );

          }

        },
        error: (err: any) => {
          // FIX: route fail hone par bhi markers + distance/direction
          // already set ho chuke hain upar, sirf route line miss hogi
          console.error('ROUTE ERROR (OSRM)', err);
          map.fitBounds([publication, press]);
        }
      });

      const infoDiv = L.DomUtil.create(
        'div',
        'map-info-box'
      );

      infoDiv.innerHTML = `
<div style="
background:white;
padding:10px;
border-radius:8px;
box-shadow:0 2px 6px rgba(0,0,0,0.3);
font-size:13px;
position:absolute;
top:10px;
right:10px;
z-index:1000;
">
<b>Distance:</b> Loading...<br>
<b>Direction:</b> ${this.direction}<br>
<b>Duration:</b> Loading...
</div>
`;

      map.getContainer().appendChild(infoDiv);
      map.fitBounds([publication, press]);

      setTimeout(() => {
        map.invalidateSize();
      }, 300);

      this.cd.detectChanges();
    });
  }
}




