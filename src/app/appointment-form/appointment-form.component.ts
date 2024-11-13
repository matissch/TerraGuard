import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';
import { combineLatest } from 'rxjs';

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

  dangerTemp: string;
  dangerPrec: string;
  dangerRain: string;
  dangerSnow: string;
  dangerSnowDepth: string;
  dangerWind10: string;
  dangerWind100: string;
  dangerGust: string;

  getDanger(score: number): string {
    let retVal = "";
    if (score < 33.3) {
      retVal = "niedrige Gefahr";
    } else if (score >= 33.3 && score < 66.6) {
      retVal = "mittlere Gefahr";
    } else {
      retVal = "hohe Gefahr";
    }
    return retVal;
  }

  constructor(private sharedService: SharedService) {}

  ngOnInit() {
    combineLatest([
      this.sharedService.currentScoreTemp,
      this.sharedService.currentScorePrecipitation,
      this.sharedService.currentScoreRain,
      this.sharedService.currentScoreSnowfall,
      this.sharedService.currentScoreSnowDepth,
      this.sharedService.currentScoreWind10m,
      this.sharedService.currentScoreWind100m,
      this.sharedService.currentScoreWindGust
    ]).subscribe(([scoreTemp, scorePrec, scoreRain, scoreSnow, scoreSnowDepth, scoreWind10m, scoreWind100m, scoreWindGust]) => {
      this.scoreTemp = scoreTemp;
      this.scorePrec = scorePrec;
      this.scoreRain = scoreRain;
      this.scoreSnow = scoreSnow;
      this.scoreSnowDepth = scoreSnowDepth;
      this.scoreWind10m = scoreWind10m;
      this.scoreWind100m = scoreWind100m;
      this.scoreWindGust = scoreWindGust;
  
      // Update the danger levels
      this.dangerTemp = this.getDanger(this.scoreTemp);
      this.dangerPrec = this.getDanger(this.scorePrec);
      this.dangerRain = this.getDanger(this.scoreRain);
      this.dangerSnow = this.getDanger(this.scoreSnow);
      this.dangerSnowDepth = this.getDanger(this.scoreSnowDepth);
      this.dangerWind10 = this.getDanger(this.scoreWind10m);
      this.dangerWind100 = this.getDanger(this.scoreWind100m);
      this.dangerGust = this.getDanger(this.scoreWindGust);
    });
  }

}
