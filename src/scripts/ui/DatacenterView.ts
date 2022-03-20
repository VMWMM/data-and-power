
// import { Datacenter, ScheduledTask } from "../simulation";

// let canvas = document.getElementById("datacenterViewCanvas")! as HTMLCanvasElement
// const context = canvas.getContext("2d")!;

// // context.translate(0, canvas.height);
// // context.scale(1, -1);
// const height = canvas.height;
// const width = canvas.width;


// interface Color {
//   r: number;
//   g: number;
//   b: number;
//   a: number;
// }

// function getColorStringC(color: Color): string {
//   return `rgba(${color.r},${color.g},${color.b}, ${color.a})`;
// }
// const plotGraphColor = { r: 0, g: 0, b: 0, a: 255 };
// const plotUncertainColor = { r: 0, g: 110, b: 0, a: 120 };
// const plotLineThickness = 2;

// const plotBgColor = { r: 255, g: 255, b: 255, a: 255 };
// const plotAxisColor = { r: 100, g: 100, b: 100, a: 255 };

// const plotStepsInAdvance = 24;
// const xPixelsPerStep = width / (plotStepsInAdvance - 1);
// const yAxisScale = 1000;
// const yAxisOffset = 1;
// function viewDatacenter(dc: Datacenter, currentSimulationTime: number) {
//   const plotableWorkloadPower = generatePlotValueOfFunc((t: number) => dc.getCurrentPowerReq(t), currentSimulationTime, currentSimulationTime + plotStepsInAdvance, 10);

//   context.filter = "blur(0px)";
//   drawGraphBg();
//   drawAxisTexts("Time", "Value");
//   // const plotValues = {{1_value,1:uncertainty}} as plotValue[];
//   const plotValues = generatePlotValueOfFunc((x: number) => x, 0, 1, plotStepsInAdvance);
//   // context.fillStyle = getColorStringC({r:255,g:0,b:0, a:255});
//   // plotFunctionWithUncertainty(plotValues, 0, 1, plotGraphColor, plotUncertainColor);


//   plotFunction(plotableWorkloadPower, 0, 10, plotGraphColor); //func WIP params a bit weird still, need better timestep...
// }



// const distOfUpAxis = width / 20;
// const distOfLeftAxis = height / 20;
// function drawGraphBg() {
//   context.fillStyle = getColorStringC(plotBgColor);
//   ownFillRect(0, 0, width, height);
//   context.fillStyle = getColorStringC(plotGraphColor);
//   ownFillRect(distOfUpAxis, distOfLeftAxis, 1, height);
//   ownFillRect(distOfUpAxis, distOfLeftAxis, width, 1);
// }

// function drawAxisTexts(xAxisName: string, yAxisName: string) {
//   context.fillStyle = getColorStringC(plotAxisColor);
//   context.font = "20px Times New Roman";
//   ownFillText(xAxisName, width - distOfUpAxis, distOfLeftAxis / 2);
//   ownFillText(yAxisName, distOfUpAxis / 4, height - distOfLeftAxis);
// }



// function generatePlotValueOfFunc(func: (x: number) => number, start: number, end: number, valuesPerStep: number) {
//   let plotValues: plotValue[] = [];
//   let testValue = 0;
//   for (let i = start; i < end; i += 1 / valuesPerStep) {
//     testValue += Math.random() * 1 - 0.5;
//     testValue = Math.max(0, testValue);

//     plotValues.push({ value: func(i), uncertainty: 0 });
//   }
//   return plotValues;
// }


// type plotValue = { value: number, uncertainty: number };
// function plotFunction(plotValues: plotValue[], startIndex: number, valuesPerStep: number, lineColor: Color) {
//   var lastXPos = 0;
//   var lastYPos = plotValues[startIndex].value;
//   for (let i = startIndex; i < plotValues.length; i++) {
//     const element = plotValues[i];
//     const xPos = (i / valuesPerStep) * xPixelsPerStep;
//     const yPos = ((element.value - yAxisOffset) / yAxisScale) * height;
//     ownStroke(lastXPos, lastYPos, xPos, yPos, lineColor);
//     lastXPos = xPos;
//     lastYPos = yPos;
//   }
// }

// function plotFunctionWithUncertainty(plotValues: plotValue[], startIndex: number, valuesPerStep: number, lineColor: Color, fillColor: Color) {
//   for (let i = startIndex; i < plotValues.length; i++) {
//     const element = plotValues[i];
//     //log plotValue at i
//     console.log("plotValue at " + i + ": " + element.value + " with uncertainty " + element.uncertainty);
//     const xPos = (i / valuesPerStep) * xPixelsPerStep;
//     const yPos = ((element.value - yAxisOffset) / yAxisScale) * height;
//     plotYValue(xPos, yPos, (element.uncertainty) / yAxisScale, lineColor, fillColor);
//   }
// }
// function plotYValue(xPos: number, yPos: number, uncertainty: number, lineColor: Color, fillColor: Color) {
//   xPos += distOfUpAxis;
//   yPos += distOfLeftAxis;
//   context.fillStyle = getColorStringC(fillColor);
//   ownFillRect(xPos, (yPos - (uncertainty / 2)), xPixelsPerStep, uncertainty);
//   context.fillStyle = getColorStringC(lineColor);
//   ownFillRect(xPos, yPos + Math.ceil(uncertainty / 2), xPixelsPerStep, plotLineThickness);
//   ownFillRect(xPos, yPos - Math.ceil(uncertainty / 2), xPixelsPerStep, plotLineThickness);
// }

// function ownFillRect(x: number, y: number, xs: number, ys: number) {
//   context.fillRect(x, height - y - ys, xs, ys);
// }
// function ownFillText(str: string, x: number, y: number) {
//   context.fillText(str, x, height - y);
// }

// function ownStroke(fromX: number, fromY: number, toX: number, toY: number, color: Color) {
//   context.strokeStyle = getColorStringC(color);
//   context.beginPath();
//   context.moveTo(fromX, height - fromY);
//   context.lineTo(toX, height - toY);
//   context.stroke();
// }

// const testDatacenter = new Datacenter(0, "Test", [0, 0], 50, 1000, 1, []);
// testDatacenter.tasks = [new ScheduledTask(1, 100, -1, 4), new ScheduledTask(40, 0, -1, 0)];
// viewDatacenter(testDatacenter, 4);
