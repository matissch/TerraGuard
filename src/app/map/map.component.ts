import { Component, AfterViewInit } from '@angular/core';
import { tileLayer, latLng, marker, Marker, icon, Map } from 'leaflet';
import * as L from 'leaflet'; // Import the L namespace
import * as proj4 from 'proj4';
import 'proj4leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  address: string = '';
  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' })
    ],
    zoom: 12,
    center: latLng(37.7749, -122.4194)
  };
  layers: Marker<any>[] = [];
  private map: Map;

  ngAfterViewInit() {
    this.map = new Map('map').setView(this.options.center, this.options.zoom);
    
    // Add OpenStreetMap base layer
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add WMS layer from geocat.ch (Switzerland maps)
    tileLayer.wms('https://wms.geo.admin.ch/', {
      layers: 'ch.bafu.gefaehrdungskarte-oberflaechenabfluss', // Replace with desired geocat.ch layer
      format: 'image/png',
      transparent: true,
      attribution: 'Map data © geocat.ch'
    }).addTo(this.map);

    // Fetch and add GeoJSON layer
    this.addGeoJSONLayer();

    // Listen for the moveend event
    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      this.options.center = latLng(center.lat, center.lng);
      this.options.zoom = this.map.getZoom();
      console.log('Map moved to center:', this.options.center, 'with zoom:', this.options.zoom);
    });
  }

  private addGeoJSONLayer(): void {
    const geojsonUrl = 'https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-10min/ch.meteoschweiz.messwerte-niederschlag-10min_de.json';

    // Define the EPSG:2056 projection
    const crs = new L.Proj.CRS('EPSG:2056',
      '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
      {
        resolutions: [4000, 2000, 1000, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5]
      }
    );

    fetch(geojsonUrl)
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          pointToLayer: (feature, latlng) => {
            // Transform coordinates from EPSG:2056 to EPSG:4326
            const transformedLatLng = crs.projection.unproject(L.point(latlng.lng, latlng.lat));
            return L.marker(transformedLatLng, {
              icon: L.icon({
                iconSize: [25, 41],
                iconAnchor: [13, 41],
                iconUrl: 'assets/images/marker-icon.png',
                iconRetinaUrl: 'assets/images/marker-icon-2x.png',
                shadowUrl: 'assets/images/marker-shadow.png'
              })
            });
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.description) {
              layer.bindPopup(feature.properties.description);
            }
          }
        }).addTo(this.map);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  }

  searchAddress() {
    if (!this.address) return;

    console.log('Searching for address:', this.address);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.address}`)
      .then(response => response.json())
      .then(data => {
        console.log('Search results:', data);
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          this.updateMap(lat, lon);
        } else {
          alert('Address not found');
        }
      })
      .catch(error => {
        console.error('Error fetching address:', error);
        alert('Error fetching address');
      });
  }

  updateMap(lat: number, lon: number) {
    const newCenter = latLng(lat, lon);
    this.map.setView(newCenter, 15); // Directly update the map center and zoom
    this.layers = [marker([lat, lon], {
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: 'assets/images/marker-icon.png',
        iconRetinaUrl: 'assets/images/marker-icon-2x.png',
        shadowUrl: 'assets/images/marker-shadow.png'
      })
    })];
    console.log('Map updated to center:', newCenter);
  }
}
