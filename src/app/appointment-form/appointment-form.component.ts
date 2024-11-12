import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-appointment-form',
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit {
  scoreTemp: number;
  scorePrec: number;
  scoreRain: number;
  scoreSnow: number;
  scoreSnowDepth: number;
  scoreWind10m: number;
  scoreWind100m: number;
  scoreWindGust: number;

  constructor(private sharedService: SharedService) {}

  ngOnInit() {
    this.sharedService.currentScoreTemp.subscribe(scoreTemp => this.scoreTemp = scoreTemp);
    this.sharedService.currentScorePrecipitation.subscribe(scorePrec => this.scorePrec = scorePrec);
    this.sharedService.currentScoreRain.subscribe(scoreRain => this.scoreRain = scoreRain);
    this.sharedService.currentScoreSnowfall.subscribe(scoreSnow => this.scoreSnow = scoreSnow);
    this.sharedService.currentScoreSnowDepth.subscribe(scoreSnowDepth => this.scoreSnowDepth = scoreSnowDepth);
    this.sharedService.currentScoreWind10m.subscribe(scoreWind10m => this.scoreWind10m = scoreWind10m);
    this.sharedService.currentScoreWind100m.subscribe(scoreWind100m => this.scoreWind100m = scoreWind100m);
    this.sharedService.currentScoreWindGust.subscribe(scoreWindGust => this.scoreWindGust = scoreWindGust);

  }

}
