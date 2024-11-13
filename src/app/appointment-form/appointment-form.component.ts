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
      retVal = "normale Gefahr";
    } else if (score >= 33.3 && score < 66.6) {
      retVal = "mittlere Gefahr";
    } else {
      retVal = "hohe Gefahr";
    }
    return retVal;
  }

  constructor(private sharedService: SharedService) {}

  ngOnInit() {
    this.sharedService.currentScoreTemp.subscribe(scoreTemp => this.scoreTemp = scoreTemp);
    this.sharedService.currentScorePrecipitation.subscribe(scorePrec => this.scorePrec = scorePrec);
    this.sharedService.currentScoreRain.subscribe(scoreRain => this.scoreRain = scoreRain);
    this.sharedService.currentScoreSnowfall.subscribe(scoreSnow => this.scoreSnow = scoreSnow);
    this.sharedService.currentScoreSnowDepth.subscribe(scoreSnowDepth => this.scoreSnowDepth = scoreSnowDepth);
    this.sharedService.currentScoreWind10m.subscribe(scoreWind10m => this.scoreWind10m = scoreWind10m);
    this.sharedService.currentScoreWind100m.subscribe(scoreWind100m => this.scoreWind100m = scoreWind100m);
    this.sharedService.currentScoreWindGust.subscribe(scoreWindGust => this.scoreWindGust = scoreWindGust)
    this.sharedService.currentDangerTemp.subscribe(scoreTemp => {this.dangerTemp = this.getDanger(this.scoreTemp);});
    this.sharedService.currentDangerPrec.subscribe(scorePrec => {this.dangerPrec = this.getDanger(this.scorePrec);});
    this.sharedService.currentDangerRain.subscribe(scoreRain => {this.dangerRain = this.getDanger(this.scoreRain);});
    this.sharedService.currentDangerSnow.subscribe(scoreSnow => {this.dangerSnow = this.getDanger(this.scoreSnow);});
    this.sharedService.currentDangerSnowDepth.subscribe(scoreSnowDepth => {this.dangerSnowDepth = this.getDanger(this.scoreSnowDepth);});
    this.sharedService.currentDangerWind10.subscribe(scoreWind10m => {this.dangerWind10 = this.getDanger(this.scoreWind10m);});
    this.sharedService.currentDangerWind100.subscribe(scoreWind100m => {this.dangerWind100 = this.getDanger(this.scoreWind100m);});
    this.sharedService.currentDangerGust.subscribe(scoreWindGust => {this.dangerGust = this.getDanger(this.scoreWindGust);})    
  }

}
