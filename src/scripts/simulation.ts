class SimulationManager {
  datacenters!: Datacenter[];
  powersources!: Powersource[];
  currentTimeStamp!: number;
  constructor() {
  }
  initialize() {
    this.datacenters = [ 
      new Datacenter(0, "Berlin", [52, 13], 10, 100, 1, [1, 5]),
      new Datacenter(1, "Paris", [48.8, 2.3], 30, 200, 2, [1, 3]),
      new Datacenter(2, "Ireland", [53.3, -6.6], 5, 50, 1.5, [5, 3])
    ];
    this.powersources = [
      new Powersource("German Bay Offshore Wind Park", [54.6, 7.2], PowersourceType.WIND),
      new Powersource("Alpine Dams", [47.3, 10.1], PowersourceType.WIND),
      new Powersource("Norwegian Hydropower", [61.9, 7.1], PowersourceType.WIND),
      new Powersource("French Solar", [45.3, 1.6], PowersourceType.SUN),
    ];
    this.currentTimeStamp = 0;
  }
  simulateTurn() {
    //update Simulation Logic
    //simulate tasks
    //simulate power
    //simulate task work
    //calculate energy cost
    //update UI
    //calculate points (task completed / time??)
    //wait
    //currentTimestep++;
    //generate new incoming tasks
    //generate new func
  }
  updateUI(){
    //draw things
  }
}

class Datacenter {
  id: number;
  name: string;
  position: [number, number];
  baseConsumption: number;
  maxWorkload: number;
  workloadToPowerFac: number; //efficiency
  distToDatacenters: number[];
  //powersources: Powersource[];
  //tasks: ScheduledTask[];

  //additional
  //add effectiency
  constructor(
    id: number,
    name: string,
    position: [number, number],
    baseConsumption: number,
    maxWorkload: number,
    workloadToPowerFac: number,
    distToDatacenters: number[]
    //powersources: Powersource[],
    //distToDataCenter: number[],
  ) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.maxWorkload = maxWorkload;
    this.baseConsumption = baseConsumption;
    this.workloadToPowerFac = workloadToPowerFac;
    this.distToDatacenters = distToDatacenters;
    //this.powersources = powersources;
    //this.tasks = [];
  }

  /*
  // TODO: Refactor!
  getCurrentWorkload(atTime: number): number {
    let sum = 0;
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].startTime <= atTime && this.tasks[i].getEndTime() >= atTime) {
        sum += this.tasks[i].workload;
      }
    }
    return sum;
  }

  getCurrentPowerReq(): number {
    return this.getCurrentWorkload(this.curr) * this.workloadToPowerFac;
  }
  */
}

enum PowersourceType {
  SUN,
  WIND,
  HYDRO,
  THERMAL,
  OTHER,
}

type powerAtTimeFunction = (time: number) => number;

class Powersource {
  name: string;
  position: [number, number];
  powerType: PowersourceType;
  // estPowerAtTime: powerAtTimeFunction = (time: number) => 0;
  // estPowerOverTime: number[] = [];
  constructor(
    name: string,
    position: [number, number],
    powerType: PowersourceType
    //estPowerOverTime: number[], 
    ) {
    this.name = name;
    this.position = position;
    this.powerType = powerType;
    //this.estPowerOverTime = [];
  }
}

class Task {
  duration: number;
  workload: number;
  deadline: number;
  constructor(duration: number, workLoad: number, deadline: number) {
    this.duration = duration;
    this.workload = workLoad;
    this.deadline = deadline;
  }
}

class ScheduledTask extends Task {
  startTime: number;
  constructor(
    duration: number,
    workLoad: number,
    deadline: number,
    startTime: number
  ) {
    super(duration, workLoad, deadline);
    this.startTime = startTime;
  }

  getEndTime(): number {
    return this.startTime + this.duration;
  }
}

/*
// TODO: Refactor
function calculatePoints() {
  for (var d in datacenters) {
    for (var t in d.tasks)
  }
}
*/

export { SimulationManager, Datacenter, Powersource, PowersourceType };
