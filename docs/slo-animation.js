// create a block to avoid conflicts in the global scope
{
  const minutes = 1000;

  const containerDiv = document.currentScript.parentElement;
  const inspectOverallCanvas = containerDiv.getElementsByClassName("inspect-overall-canvas")[0];
  const inspectOverallMinute = containerDiv.getElementsByClassName("inspect-overall-minute")[0];
  const inspectOverallTable = containerDiv.getElementsByClassName("inspect-overall-table")[0];
  const inspectOverallResult = containerDiv.getElementsByClassName("inspect-overall-result")[0];

  const inspectMonitorCanvas = containerDiv.getElementsByClassName("inspect-monitor-canvas")[0];
  const inspectMinute = containerDiv.getElementsByClassName("inspect-minute")[0];
  const inspectGoodRow = containerDiv.getElementsByClassName("inspect-good-row")[0];
  const inspectGoodTotal = containerDiv.getElementsByClassName("inspect-good-t")[0];
  const inspectTotalRow = containerDiv.getElementsByClassName("inspect-total-row")[0];
  const inspectTotalTotal = containerDiv.getElementsByClassName("inspect-total-t")[0];
  const inspectValueRow = containerDiv.getElementsByClassName("inspect-value-row")[0];
  const inspectOuterValue = containerDiv.getElementsByClassName("inspect-outer-value")[0];
  const inspectInnerValue = containerDiv.getElementsByClassName("inspect-inner-value")[0];

  const animationDiv = containerDiv.getElementsByClassName("slo-animation")[0];

  const alertThreshold = Number(animationDiv.getAttribute("alertThreshold"));
  const successRate = Number(animationDiv.getAttribute("successRate"));
  const monitorCount = Number(animationDiv.getAttribute("monitorCount"));
  const reqPerMin = Number(animationDiv.getAttribute("requestsPerMinute"));
  const evalWindowMinutes = Number(animationDiv.getAttribute("evalWindowMinutes"));

  const sloTable = animationDiv.getElementsByClassName("slo-table")[0];

  const overallUptime = animationDiv.getElementsByClassName("overall-uptime")[0];
  const overallCanvas = animationDiv.getElementsByClassName("overall-canvas")[0];

  const rerunButton = animationDiv.getElementsByClassName("rerun-button")[0];

  const monitors = [];
  const minuteCells = [];

  // singleton divs
  const inspectMonitorDetails = document.getElementById("inspect-monitor-details");

  rerunButton.addEventListener("click", () => {
    console.log("rerun clicked");
    animate();
  })

  overallCanvas.addEventListener("mousemove", event => {
    inspectMonitorCanvas.style.visibility = "hidden";
    inspectMonitorDetails.style.visibility = "hidden";
    inspectOverallCanvasFn(event);
  });
  overallCanvas.addEventListener("mouseout", () => {
    inspectOverallCanvas.style.visibility = "hidden";
  });

  let animationDone = false;

  // Start the animation when the animation div is in view
  const intersectionObserver = new IntersectionObserver((entries) => {
    // If intersectionRatio is 0, the target is out of view
    // and we do not need to do anything.
    if (entries[0].intersectionRatio <= 0) return;
    if (animationDone) return;

    animate();
  });

  function inspectMonitorDetailsFn(event) {
    document.getElementById("monitor-config").innerHTML = `Monitor evaluation window: ${evalWindowMinutes} minute${evalWindowMinutes > 1 ? "s" : ""}. Monitor alert threshold: <${100 * alertThreshold} %.`;
    document.getElementById("monitored-service-details").innerHTML = `Requests/minute: ${reqPerMin}. Average success rate: ${100 * successRate} %.`;

    inspectMonitorDetails.style.left = `${event.x}px`;
    inspectMonitorDetails.style.top = `${event.y + 10}px`;
    inspectMonitorDetails.style.visibility = "visible";
  }

  function inspectOverallCanvasFn(event) {
    if (animationDone && event.offsetX >= 0 && event.offsetX < minutes) {
      const m = event.offsetX;

      inspectOverallMinute.innerHTML = `Minute ${m+1}`;

      let allMonitorsGreen = true;
      for (let monIdx = 0; monIdx < monitorCount; monIdx++) {
        const monitor = monitors[monIdx];
        allMonitorsGreen = allMonitorsGreen && monitor.minutes[m].isGreen;
        monitor.inspectResult.style.background = monitor.minutes[m].isGreen ? "green" : "red";
      }
      inspectOverallResult.style.background = allMonitorsGreen ? "green" : "red";

      inspectOverallCanvas.style.left = `${event.x}px`;
      inspectOverallCanvas.style.top = `${event.y + 10}px`;
      inspectOverallCanvas.style.visibility = "visible";
    }
  }

  function inspectMonitorCanvasFn(event, monIdx) {
    // console.log(`x: ${event.x}, clientX: ${event.clientX}, layerX: ${event.layerX}, screenX: ${event.screenX}, pageX: ${event.pageX}, offsetX: ${event.offsetX}`)
    // console.log(`y: ${event.y}, clientY: ${event.clientY}, layerY: ${event.layerY}, screenY: ${event.screenY}, pageY: ${event.pageY}, offsetY: ${event.offsetY}`)

    const monitor = monitors[monIdx];

    if (animationDone && event.offsetX >= 0 && event.offsetX < minutes) {
      const m = event.offsetX;

      inspectMinute.innerHTML = `Minute ${m+1}`;

      for (let i = 0; i < evalWindowMinutes; i++) {
        const windowMinute = (1 + i - evalWindowMinutes) + m;
        minuteCells[i].good.innerHTML = windowMinute >= 0 ? monitor.minutes[windowMinute].good : '-';
        minuteCells[i].total.innerHTML = windowMinute >= 0 ? monitor.minutes[windowMinute].total : '-';
      }

      inspectGoodTotal.innerHTML = monitor.minutes[m].trailingGood;
      inspectTotalTotal.innerHTML = monitor.minutes[m].trailingTotal;

      inspectOuterValue.style.background = monitor.minutes[m].isGreen ? "green" : "red";
      inspectInnerValue.innerHTML = `${(100 * monitor.minutes[m].value).toFixed(2)} %`;

      inspectMonitorCanvas.style.left = `${event.x}px`;
      inspectMonitorCanvas.style.top = `${event.y + 10}px`;
      inspectMonitorCanvas.style.visibility = "visible";
    }
  }

  function addMonitorsToTables() {
    for (let monIdx = 0; monIdx < monitorCount; monIdx++) {
      const sloRow = sloTable.appendChild(document.createElement("tr"));

      const info = document.createElement("td");
      const canvasCell = document.createElement("td");
      const result = document.createElement("td");

      sloRow.appendChild(info);
      sloRow.appendChild(canvasCell);
      sloRow.appendChild(result);

      info.innerHTML = `Monitor ${monIdx+1} ℹ️`;
      info.addEventListener("mousemove", event => {
        inspectMonitorCanvas.style.visibility = "hidden";
        inspectMonitorDetailsFn(event);
      });
      info.addEventListener("mouseout", () => {
        inspectMonitorDetails.style.visibility = "hidden";
      });

      const canvas = canvasCell.appendChild(document.createElement("canvas"));
      canvas.height = 50;
      canvas.width = minutes;
      canvas.addEventListener("mousemove", event => {
        inspectMonitorDetails.style.visibility = "hidden";
        inspectMonitorCanvasFn(event, monIdx);
      });
      canvas.addEventListener("mouseout", () => {
        inspectMonitorCanvas.style.visibility = "hidden";
      });


      const inspectRow = document.createElement("tr");
      const inspectInfo = document.createElement("td");
      const inspectResult = document.createElement("td");

      inspectOverallTable.insertBefore(inspectRow, inspectOverallTable.children[inspectOverallTable.children.length - 1]);
      inspectRow.appendChild(inspectInfo);
      inspectRow.appendChild(inspectResult);

      inspectInfo.innerHTML = `Monitor ${monIdx+1}`;

      monitors.push({
        info,
        canvas,
        result,
        inspectResult,
        minutes: new Array(minutes),
        goodMinutes: 0,
      });
    }
  }

  function addEvalWindowToMonitorTable() {
    inspectValueRow.children[0].colSpan = evalWindowMinutes + 1;

    for (let m = 0; m < evalWindowMinutes; m++) {
      const good = document.createElement("td");
      inspectGoodRow.insertBefore(good, inspectGoodRow.children[inspectGoodRow.children.length - 1]);

      const total = document.createElement("td");
      inspectTotalRow.insertBefore(total, inspectTotalRow.children[inspectTotalRow.children.length - 1]);

      minuteCells.push({ good, total });
    }
  }

  function animate() {
    console.log("animate called");
    animationDone = false;

    for (let monIdx = 0; monIdx < monitorCount; monIdx++) {
      const monitor = monitors[monIdx];
      monitor.canvas.getContext("2d").clearRect(0, 0, monitor.canvas.width, monitor.canvas.height);
      monitor.result.innerHTML = "";
      monitor.minutes = new Array(minutes);
      monitor.goodMinutes = 0;
    }
    overallCanvas.getContext("2d").clearRect(0, 0, overallCanvas.width, overallCanvas.height);

    rerunButton.style.visibility = "hidden";
    overallUptime.innerHTML = "";

    const overallCtx = overallCanvas.getContext("2d");

    for (let monIdx = 0; monIdx < monitorCount; monIdx++) {
      const monitor = monitors[monIdx];

      for (let m = 0; m < minutes; m++) {
        monitor.minutes[m] = {
          good: reqPerMin,
          total: reqPerMin,
          trailingGood: reqPerMin * Math.min(m + 1, evalWindowMinutes),
          trailingTotal: reqPerMin * Math.min(m + 1, evalWindowMinutes),
        };
      }

      const totalRequest = minutes * reqPerMin;

      // inject random errors
      const errorCount = Math.floor(totalRequest * (1 - successRate));
      for (let e = 0; e < errorCount; e++) {
        const m = Math.floor(minutes * Math.random())

        if (monitor.minutes[m].good > 0) {
          monitor.minutes[m].good--;
          for (let wi = 0; wi < evalWindowMinutes && m + wi < minutes; wi++) {
            monitor.minutes[m + wi].trailingGood--;
          }
        } else {
          console.log('what are the odds? How unreliable is your service?');
        }
      }
    }

    // animate canvases
    let m = 0;
    let overallGoodMinutes = 0;
    const timerId = setInterval(() => {
      for (j = 0; j < 10 && m < minutes; j++, m++) {

        let allMonitorsGreen = true;
        for (let monIdx = 0; monIdx < monitorCount; monIdx++) {
          const monitor = monitors[monIdx];
          const monitorCtx = monitor.canvas.getContext("2d");

          monitor.minutes[m].value = monitor.minutes[m].trailingGood / monitor.minutes[m].trailingTotal;
          monitor.minutes[m].isGreen = monitor.minutes[m].value >= alertThreshold;
          allMonitorsGreen = allMonitorsGreen && monitor.minutes[m].isGreen;

          if (monitor.minutes[m].isGreen) {
            monitor.goodMinutes++;
            monitorCtx.fillStyle = "green";
          } else {
            monitorCtx.fillStyle = "red";
          }
          monitorCtx.fillRect(m, 0, 1, 40);
        }

        if (allMonitorsGreen) {
          overallGoodMinutes++;
          overallCtx.fillStyle = "green";
        } else {
          overallCtx.fillStyle = "red";
        }
        overallCtx.fillRect(m, 0, 1, 40);
      }

      if (m >= minutes) {
        clearInterval(timerId);
        animationDone = true;
        intersectionObserver.unobserve(animationDiv);

        for (let monIdx = 0; monIdx < monitorCount; monIdx++) {
          const monitor = monitors[monIdx];
          monitor.result.innerHTML = `${100 * monitor.goodMinutes / minutes} %`;
        }
        overallUptime.innerHTML = `${100 * overallGoodMinutes / minutes} %`;
        rerunButton.style.visibility = "visible";
      }
    }, 1)
  }

  addMonitorsToTables();
  addEvalWindowToMonitorTable();
  intersectionObserver.observe(animationDiv);
}