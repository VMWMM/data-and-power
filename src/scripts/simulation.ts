import * as SunCalc from 'suncalc';
import * as data from '../simulationData.json';

let startDate: Date | null = null;
class SimulationManager {
  dataCenters!: DataCenter[];
  powerSources!: PowerSource[];
  tasks!: Task[];
  currentTime!: number;
  coalFactor!: number;
  points!: number;
  simulationStartDate!: Date;
  nextTaskID: number = 0;

  constructor() {
    this.points = 0;
    this.currentTime = 0;
  }
  randomDeadLineTask(): DeadlineTask {
    let duration = this.currentTime + Math.random() * 48 + 1;
    let d = new DeadlineTask(
      this.nextTaskID,
      deadlineTaskNames[
      Math.round(Math.random() * (deadlineTaskNames.length - 1))
      ],
      Math.round(Math.random() * 100 + 1),
      duration,
      duration * (Math.random() + 1.5)
    );
    return d;
  }
  initialize() {
    this.powerSources = [];
    data.powerSources.forEach(
      (ps: { id: number; name: string; position: number[]; type: string }) => {
        this.powerSources.push(
          new PowerSource(
            ps.id,
            ps.name,
            [ps.position[0], ps.position[1]],
            strToPowerSourceType(ps.type)
          )
        );
      }
    );
    this.dataCenters = [];
    data.dataCenters.forEach(
      (dc: {
        id: number;
        name: string;
        position: number[];
        baseconsumption: number;
        maxWorkLoad: number;
        workLoadToPowerFac: number;
        distToDataCenters: number[];
      }) => {
        this.dataCenters.push(
          new DataCenter(
            dc.id,
            dc.name,
            [dc.position[0], dc.position[1]],
            dc.baseconsumption,
            dc.maxWorkLoad,
            dc.workLoadToPowerFac,
            dc.distToDataCenters,
            []
          )
        );
      }
    );
    data.dataCenters.forEach((dc: { id: number; powerSources: number[] }) => {
      let sources: PowerSource[] = [];
      dc.powerSources.forEach((powerSourceId) => {
        sources.push(this.powerSources[powerSourceId]);
      });
      this.dataCenters[dc.id].powerSources = sources;
    });
    this.tasks = [];
    data.tasks.forEach(
      (
        t:
          | {
            id: number;
            name: string;
            workload: number;
            mean: number;
            variance: number;
            type: string;
          }
          | {
            id: number;
            name: string;
            workload: number;
            duration: number;
            deadline: number;
            type: string;
          }
      ) => {
        if (t.type == 'CONTINUOUS' && 'mean' in t) {
          this.tasks.push(
            new ContinuousTask(t.id, t.name, t.workload, t.mean!, t.variance!)
          );
        } else if (t.type == 'DEADLINE' && 'duration' in t) {
          this.tasks.push(
            new DeadlineTask(t.id, t.name, t.workload, t.duration!, t.deadline!)
          );
        }
      }
    );
    console.log(this.dataCenters);
    //this.tasks[0].assignTask(this.dataCenters[0]);
    //this.tasks[1].assignTask(this.dataCenters[0]);
    this.currentTime = 0;
    this.simulationStartDate = new Date(Date.now());
    this.simulationStartDate.setHours(12);
    this.simulationStartDate.setMinutes(0);
    startDate = this.simulationStartDate;
    this.coalFactor = 10;
  }

  simulateTurn() {
    this.updateTasks(this.currentTime);
    this.calculateWorkLoad();
    //update Simulation Logic
    //simulate tasks
    //simulate power
    let coalUsage: number[] = this.calculateCoalUsage();
    //simulate task work
    //calculate energy cost
    //update UI
    //calculate points (task completed / time??)
    this.points += this.calculatePoints(coalUsage);
    //wait
    //generate new incoming tasks
    //generate new func
    this.currentTime++;
    this.printState();
  }

  //helper function as we dont have dashboards yet
  printState() {
    console.log('Time: ' + this.currentTime);
    this.dataCenters.forEach((dc) => {
      console.log(
        'DataCenter: ' +
        dc.name +
        ', Workload: ' +
        dc.getCurrentWorkload(this.currentTime)
      );
      dc.tasks.forEach((t) => {
        console.log(' Task: ' + t.name);
      });
    });
    console.log('Score: ' + this.points);
  }

  //not yet used since we dont update any of the visuals based on the logic
  updateUI() {
    //draw things
  }

  calculateCoalUsage(): number[] {
    var coalUsage: number[] = [];
    for (var i: number = 0; i < this.dataCenters.length; i++) {
      coalUsage[i] = 0;
      var d: DataCenter = this.dataCenters[i];
      var workNeeded: number = d.getCurrentWorkload(this.currentTime);
      let energyAvailable: number = 0;
      d.powerSources.forEach((p: PowerSource) => {
        let generatedPower = Math.max(
          0,
          (randn_bm() + 1) * p.powerForecasted[this.currentTime]
        );
        p.powerProduced[this.currentTime] = generatedPower;
        energyAvailable += generatedPower;
        p.makeNewForecast(this.currentTime);
      });
      if (workNeeded > 0) {
        energyAvailable -= d.baseConsumption;
        if (workNeeded > d.maxWorkload) {
          this.points = this.points - d.maxWorkload;
        }
        energyAvailable -= workNeeded * d.workloadToPowerFac;
        coalUsage[i] = Math.max(energyAvailable * -2, 0);
      } else {
        coalUsage[i] = 0;
      }
    }
    return coalUsage;
  }

  //sets a semi-random workload attribute for all Continuous Tasks
  calculateWorkLoad() {
    for (var i: number = 0; i < this.dataCenters.length; i++) {
      var d: DataCenter = this.dataCenters[i];
      for (var j: number = 0; j < d.tasks.length; j++) {
        var t = d.tasks[j];
        if (t instanceof ContinuousTask) {
          t.workLoad = Math.max(randn_bm() * t.variance + t.mean, 0);
        }
      }
    }
  }

  calculatePoints(coalUsed: number[]): number {
    var addPoints: number = 0;
    for (var i: number = 0; i < this.dataCenters.length; i++) {
      var d: DataCenter = this.dataCenters[i];
      addPoints -= coalUsed[i] * this.coalFactor;
      for (var j: number = 0; j < d.tasks.length; j++) {
        var t = d.tasks[j];
        if (t instanceof ContinuousTask) {
          addPoints += (1 - 2 * t.delay) * t.workLoad;
        } else if (t instanceof DeadlineTask) {
          var finished: boolean = false;
          if (this.currentTime >= t.deadline) {
            if (t.startTime + t.duration <= t.deadline) {
              finished = true;
            }
            addPoints += this.removeTask(d.tasks[j], finished);
          } else {
            if (this.currentTime - t.duration > t.startTime) {
              finished = true;
              addPoints += this.removeTask(d.tasks[j], finished);
            }
          }
        }
      }
    }
    console.log('additional points:' + addPoints);
    return addPoints;
  }

  //check for each task whether they are now active or already over
  //TODO: check if task was fulfilled or stopped by deadline (could be done earlier)
  updateTasks(atTime: number) {
    this.tasks.forEach((t) => {
      if (t instanceof DeadlineTask) {
        if (t.startTime <= atTime) {
          if (t.startTime + t.duration <= atTime) {
            this.points += this.removeTask(t, true);
          } else t.active = true;
        } else if (t.deadline < atTime) {
          this.points += this.removeTask(t, true);
        }
      } else if (t instanceof ContinuousTask) {
        if (t.scheduled) t.active = true;
      }
    });
  }

  //remove task from global and data center list
  removeTask(t: Task, finished: boolean) {
    var points = t.workLoad;
    this.tasks.splice(this.tasks.indexOf(t), 1);
    if (t.scheduled)
      t.dataCenter.tasks.splice(t.dataCenter.tasks.indexOf(t), 1);
    if (finished) {
      return points;
    } else {
      return -points;
    }
  }

  getDateFromSimTime(): Date {
    const date = new Date(this.simulationStartDate.toString());
    date.setHours(date.getHours() + this.currentTime);
    return date;
  }
}

class DataCenter {
  id: number;
  name: string;
  position: [number, number];
  baseConsumption: number;
  maxWorkload: number;
  workloadToPowerFac: number; //efficiency
  distToDataCenters: number[];

  powerSources: PowerSource[];
  tasks: Task[];

  //additional
  //add effectiency
  constructor(
    id: number,
    name: string,
    position: [number, number],
    baseConsumption: number,
    maxWorkload: number,
    workloadToPowerFac: number,
    distToDataCenters: number[],
    powerSources: PowerSource[]
  ) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.maxWorkload = maxWorkload;
    this.baseConsumption = baseConsumption;
    this.workloadToPowerFac = workloadToPowerFac;
    this.distToDataCenters = distToDataCenters;
    this.powerSources = powerSources;
    this.tasks = [];
  }
  getCurrentPowerReq(atTimeStep: number): number {
    return (
      this.getCurrentWorkload(atTimeStep) * this.workloadToPowerFac +
      this.baseConsumption
    );
    this.tasks = [];
  }

  //sum workload of all active tasks for dataCenter
  getCurrentWorkload(currentTime: number): number {
    let sum = 0;

    this.tasks.forEach((t) => {
      if (t.active) {
        //TODO WENN zwischen Timesteps deadline task fertig, nicht die volle workload
        let factor = 1;
        if (
          t instanceof DeadlineTask &&
          t.startTime + t.duration <= currentTime
        ) {
          factor = 1 - (currentTime - t.startTime + t.duration);
        }
        sum += t.workLoad * factor;
      }
    });
    return sum;
  }
}

enum PowerSourceType {
  SUN,
  WIND,
  HYDRO,
  THERMAL,
  OTHER,
}

function strToPowerSourceType(name: string) {
  if (name == 'SUN') return PowerSourceType.SUN;
  if (name == 'WIND') return PowerSourceType.WIND;
  if (name == 'HYDRO') return PowerSourceType.HYDRO;
  if (name == 'THERMAL') return PowerSourceType.THERMAL;
  return PowerSourceType.OTHER;
}

type powerAtTimeFunction = (time: number) => number;

class PowerSource {
  id: number;
  name: string;
  position: [number, number];
  powerType: PowerSourceType;
  powerProduced: number[];
  powerForecasted: number[];
  // estPowerAtTime: powerAtTimeFunction = (time: number) => 0;
  // estPowerOverTime: number[] = [];
  constructor(
    id: number,
    name: string,
    position: [number, number],
    powerType: PowerSourceType

    //estPowerOverTime: number[],
  ) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.powerType = powerType;
    this.powerProduced = [];
    this.powerForecasted = [];
    switch (powerType) {
      case PowerSourceType.WIND:
        this.powerForecasted[0] = windDefault[0];
        break;
      case PowerSourceType.THERMAL:
        this.powerForecasted[0] = thermalDefault[0];
        break;
      case PowerSourceType.SUN:
        this.powerForecasted[0] = getSunValue(0, this.position);
        break;
      case PowerSourceType.HYDRO:
        this.powerForecasted[0] = waterDefault[0];
        break;
      default:
        break;
    }
    //this.estPowerOverTime = [];
  }

  makeNewForecast(time: number): void {
    for (let i = 0; i < 24; i++) {
      let newForecast = 0;
      switch (this.powerType) {
        case PowerSourceType.WIND:
          newForecast = windDefault[(i + 1 + time) % 24];
          break;
        case PowerSourceType.THERMAL:
          newForecast = thermalDefault[(i + 1 + time) % 24];
          break;
        case PowerSourceType.SUN:
          newForecast = getSunValue(i + 1 + time, this.position);
          break;
        case PowerSourceType.HYDRO:
          newForecast = waterDefault[(i + 1 + time) % 24];
          break;
        default:
          break;
      }
      this.powerForecasted[time + i + 1] =
        newForecast * this.getPowerSourceFactor();
    }
  }

  getPowerSourceFactor(): number {
    // This should probably be a property of power sources to model their size
    switch (this.powerType) {
      case PowerSourceType.HYDRO: {
        return 30;
      }
      case PowerSourceType.SUN: {
        return 15;
      }
      case PowerSourceType.WIND: {
        return 20;
      }
      case PowerSourceType.THERMAL: {
        return 10;
      }
    }
    return 1;
  }
}

export abstract class Task {
  id: number;
  name: string;
  workLoad: number;
  active: boolean;
  scheduled: boolean;
  dataCenter!: DataCenter;
  constructor(id: number, name: string, workLoad: number, active: boolean) {
    this.id = id;
    this.name = name;
    this.workLoad = workLoad;
    this.active = active;
    this.scheduled = false;
  }

  assignTask(dc: DataCenter, currentTime: number): boolean {
    let dist = 0;
    if ((this.scheduled, this.active)) {
      console.log(this.dataCenter);
      dist = this.dataCenter.distToDataCenters[dc.id];
    }
    let currentLoad = dc.getCurrentPowerReq(currentTime);
    if (currentLoad + this.workLoad * dc.workloadToPowerFac <= dc.maxWorkload) {
      dc.tasks.push(this);
      this.dataCenter = dc;
      this.scheduled = true;
      let delay = 2 + 0.1 * dist * dist;
      if (this instanceof ContinuousTask) {
        this.delay = delay;
      } else if (this instanceof DeadlineTask) {
        this.startTime += delay;
      }

      return true;
    } else {
      return false;
    }
  }

  getDisplayColor(): string {
    throw new Error('Subclass responsibility');
  }
}

export class DeadlineTask extends Task {
  duration: number;
  startTime!: number;
  deadline: number;
  constructor(
    id: number,
    name: string,
    workLoad: number,
    duration: number,
    deadline: number
  ) {
    super(id, name, workLoad, false);
    this.duration = duration;
    this.deadline = deadline;
  }

  assignDeadlineTask(dc: DataCenter, atTime: number): boolean {
    /*let currentLoad = dc.getCurrentWorkload(currentTime);
    if(currentLoad + this.workLoad * dc.workloadToPowerFac <= dc.maxWorkload) {
      dc.tasks.push(this);
      console.log(dc.tasks)
      this.active = true;
      this.dataCenter = dc;
      this.startTime = atTime;
      this.scheduled = true;
      return true;
    } else {
      return false;
    }*/

    if (super.assignTask(dc, atTime)) {
      this.startTime = atTime;
      if (atTime == this.startTime) this.active = true;
      return true;
    } else {
      return false;
    }
  }

  getEndTime(): number {
    return this.startTime + this.duration;
  }

  isInProgress(atTime: number): boolean {
    return this.startTime <= atTime && this.getEndTime() >= atTime;
  }

  getDisplayColor() {
    return 'lightsalmon';
  }
}

export class ContinuousTask extends Task {
  mean: number;
  variance: number;
  delay: number;
  constructor(
    id: number,
    name: string,
    workLoad: number,
    mean: number,
    variance: number
  ) {
    super(id, name, workLoad, false);
    this.mean = mean;
    this.variance = variance;
    this.delay = 0;
  }

  assignContinuousTask(dc: DataCenter, currentTime: number): boolean {
    let currentLoad = dc.getCurrentWorkload(currentTime);
    if (currentLoad + this.workLoad * dc.workloadToPowerFac <= dc.maxWorkload) {
      dc.tasks.push(this);
      this.dataCenter = dc;
      this.scheduled = true;
      return true;
    } else {
      return false;
    }
  }

  getDisplayColor() {
    return 'lightyellow';
  }
}

function randn_bm() {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function getSunValue(time: number, position: [number, number]) {
  if (startDate) {
    let date = new Date(startDate.toISOString());
    date.setHours(date.getHours() + time);
    let solarCalculator = SunCalc.getTimes(date, position[0], position[1]);
    let sunrise = solarCalculator.sunrise;
    let sunset = solarCalculator.sunset;
    if (
      sunrise.getTime() > date.getTime() ||
      sunset.getTime() < date.getTime()
    ) {
      return 0;
    } else {
      // TODO: Add diminishing factors near night
      return [
        0.9, 0.8, 0.8, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1,
        0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,
      ][time % 24];
    }
  }
  return 0;
}
const thermalDefault: number[] = [
  0.53, 0.53, 0.53, 0.6, 0.57, 0.61, 0.67, 0.65, 0.73, 0.71, 0.7, 0.73, 0.8,
  0.77, 0.87, 0.93, 0.89, 0.97, 1, 0.93, 0.8, 0.6, 0.5, 0.53,
];
const windDefault: number[] = [
  0.55, 0.59, 0.73, 0.91, 1, 0.86, 0.73, 0.64, 0.45, 0.27, 0.23, 0.14, 0.14,
  0.27, 0.32, 0.41, 0.45, 0.55, 0.59, 0.45, 0.32, 0.23, 0.14, 0.09,
];
const waterDefault: number[] = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 0.8, 0.8, 1, 1, 1.2, 1.2, 1, 1, 1, 1, 1, 1, 1, 1,
  1,
];
const deadlineTaskNames: string[] = [
  'genome calculation',
  'Pi digits calculation',
  'Stockfish',
  'AI Training',
];
export { SimulationManager, DataCenter, PowerSource, PowerSourceType };
