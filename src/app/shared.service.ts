import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private scoreTempSource = new BehaviorSubject<number>(0);
  private scorePrecipitationSource = new BehaviorSubject<number>(0);
  private scoreRainSource = new BehaviorSubject<number>(0);
  private scoreSnowfallSource = new BehaviorSubject<number>(0);
  private scoreSnowDepthSource = new BehaviorSubject<number>(0);
  private scoreWind10mSource = new BehaviorSubject<number>(0);
  private scoreWind100mSource = new BehaviorSubject<number>(0);
  private scoreWindGustSource = new BehaviorSubject<number>(0);

  private dangerTemp = new BehaviorSubject<string>("");
  private dangerPrec = new BehaviorSubject<string>("");
  private dangerRain = new BehaviorSubject<string>("");
  private dangerSnow = new BehaviorSubject<string>("");
  private dangerSnowDepth = new BehaviorSubject<string>("");
  private dangerWind10 = new BehaviorSubject<string>("");
  private dangerWind100 = new BehaviorSubject<string>("");
  private dangerGust = new BehaviorSubject<string>("");


currentDangerTemp = this.dangerTemp.asObservable();
currentDangerPrec = this.dangerPrec.asObservable();
currentDangerRain = this.dangerRain.asObservable();
currentDangerSnow = this.dangerSnow.asObservable();
currentDangerSnowDepth = this.dangerSnowDepth.asObservable();
currentDangerWind10 = this.dangerWind10.asObservable();
currentDangerWind100 = this.dangerWind100.asObservable();
currentDangerGust = this.dangerGust.asObservable();

  currentScoreTemp = this.scoreTempSource.asObservable();
  currentScorePrecipitation = this.scorePrecipitationSource.asObservable();
  currentScoreRain = this.scoreRainSource.asObservable();
  currentScoreSnowfall = this.scoreSnowfallSource.asObservable();
  currentScoreSnowDepth = this.scoreSnowDepthSource.asObservable();
  currentScoreWind10m = this.scoreWind10mSource.asObservable();
  currentScoreWind100m = this.scoreWind100mSource.asObservable();
  currentScoreWindGust = this.scoreWindGustSource.asObservable();

  constructor() { }

  changeScoreTemp(score: number) {
    this.scoreTempSource.next(score);
  }
  
  changeScorePrecipitation(score: number) {
    this.scorePrecipitationSource.next(score);
  }

  changeScoreRain(score: number) {
    this.scoreRainSource.next(score);
  }

  changeScoreSnowfall(score: number) {
    this.scoreSnowfallSource.next(score);
  }

  changeScoreSnowDepth(score: number) {
    this.scoreSnowDepthSource.next(score);
  }

  changeScoreWindSpeed10m(score: number) {
    this.scoreWind10mSource.next(score);
  }

  changeScoreWindSpeed100m(score: number) {
    this.scoreWind100mSource.next(score);
  }

  changeScoreWindGusts10m(score: number) {
    this.scoreWindGustSource.next(score);
  }
  getDanger(score: number){
    var retVal = ""
    if(score < 33.3){retVal ="normale Gefahr"}
    else if (score >= 33.3 && score < 66.6){retVal = "mittlere Gefahr"}
    else{retVal = "hohe Gefahr"}
    return retVal
  }
}
