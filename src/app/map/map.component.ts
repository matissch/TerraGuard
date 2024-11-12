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
  hail: boolean = true;
  rain: boolean = false;
  wmsLayer: any;

  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 200, attribution: '© OpenStreetMap contributors' })
    ],
    zoom: 12,
    center: latLng(47.499950, 8.737565)
  };
  layers: Marker<any>[] = [];
  private map: Map;

  private hailLayer = tileLayer('https://wms.geo.admin.ch/', {
    layers: "ch.meteoschweiz.hagelgefaehrdung-korngroesse_10_jahre",
    maxZoom: 18,
    format: 'image/png',
    transparent: true,
    attribution: 'Map data © geocat.ch'
  });

  private rainLayer = tileLayer.wms('https://wms.geo.admin.ch/', {
    layers: 'ch.bafu.gefaehrdungskarte-oberflaechenabfluss',
    format: 'image/png',
    maxZoom: 18,
    transparent: true,
    attribution: 'Map data © geocat.ch'
  });

  ngAfterViewInit() {
    this.map = new Map('map').setView(this.options.center, this.options.zoom);
    
    // Add OpenStreetMap base layer
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add WMS layer from geocat.ch (Switzerland maps)
    this.wmsLayer = tileLayer.wms('https://wms.geo.admin.ch/', {
      layers: 'ch.meteoschweiz.hagelgefaehrdung-korngroesse_10_jahre', // Replace with desired geocat.ch layer
      format: 'image/png',
      transparent: true,
      opacity: 0.5,
      attribution: 'Map data © geocat.ch'
    }).addTo(this.map);

    // Listen for the moveend event
    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      this.options.center = latLng(center.lat, center.lng);
      this.options.zoom = this.map.getZoom();
      console.log('Map moved to center:', this.options.center, 'with zoom:', this.options.zoom);
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

  toggleLayer(event: any) {
    const layer = event.source.name;
    const isChecked = event.checked;
    console.log(`${layer} layer is ${isChecked ? 'enabled' : 'disabled'}`);
    
    // Update the state of the variables based on the toggle
    if (layer === 'hailToggle') {
      this.hail = isChecked;
      this.rain = !isChecked;
      this.switchLayer();
    } else if (layer === 'rainToggle') {
      this.hail = !isChecked;
      this.rain = isChecked;
      this.switchLayer();
    }
  }

  switchLayer() {
    if (this.hail) {
      // Clear all alyers from map
      this.map.removeLayer(this.wmsLayer);
      this.wmsLayer = tileLayer.wms('https://wms.geo.admin.ch/', {
        layers: "ch.meteoschweiz.hagelgefaehrdung-korngroesse_10_jahre",
        maxZoom: 18,
        format: 'image/png',
        transparent: true,
        opacity: 0.5,
        attribution: 'Map data © geocat.ch'
      }).addTo(this.map);
    } else if (this.rain) {
      this.map.removeLayer(this.wmsLayer);
      this.wmsLayer = tileLayer.wms('https://wms.geo.admin.ch/', {
        layers: 'ch.bafu.gefaehrdungskarte-oberflaechenabfluss',
        format: 'image/png',
        maxZoom: 18,
        transparent: true,
        attribution: 'Map data © geocat.ch'
      }).addTo(this.map);
    }
  }

}
