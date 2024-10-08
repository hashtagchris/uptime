// create a block to avoid conflicts in the global scope
{
  const div = document.currentScript.parentElement;

  const alertThreshold = Number(div.getAttribute("alertThreshold"));
  const successRate = Number(div.getAttribute("successRate"));

  const canvas = div.getElementsByClassName("canvas")[0];
  const monitorConfigDiv = div.getElementsByClassName("monitor-config")[0];
  const observedDiv = div.getElementsByClassName("observed")[0];
  const progressResultDiv = div.getElementsByClassName("progress-result")[0];
  const rerunButton = div.getElementsByClassName("rerun-button")[0];

  // singleton divs
  const canvasDetail = document.getElementById("inspect");

  rerunButton.addEventListener("click", () => {
    console.log("rerun clicked");
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    animate();
  })

  canvas.addEventListener("mousemove", inspect);

  canvas.addEventListener("mouseout", () => {
    canvasDetail.style.visibility = "hidden";
  });

  const minutes = Array(1000);
  let animationDone;

  function inspect(event) {
    // console.log(`x: ${event.x}, clientX: ${event.clientX}, layerX: ${event.layerX}, screenX: ${event.screenX}, pageX: ${event.pageX}, offsetX: ${event.offsetX}`)
    // console.log(`y: ${event.y}, clientY: ${event.clientY}, layerY: ${event.layerY}, screenY: ${event.screenY}, pageY: ${event.pageY}, offsetY: ${event.offsetY}`)

    if (animationDone && event.offsetX >= 0 && event.offsetX < minutes.length) {
      const m = event.offsetX;

      document.getElementById("inspect-minute").innerHTML = `Minute ${m}`;
      document.getElementById("inspect-good").innerHTML = minutes[m].trailingGood;
      document.getElementById("inspect-total").innerHTML = minutes[m].trailingTotal;

      const val = minutes[m].trailingGood / minutes[m].trailingTotal;
      document.getElementById("inspect-outer-value").style.background = val >= alertThreshold ? "green" : "red";
      document.getElementById("inspect-inner-value").innerHTML = `${(100 * val).toFixed(2)} %`;

      canvasDetail.style.left = `${event.x}px`;
      canvasDetail.style.top = `${event.y + 10}px`;
      canvasDetail.style.visibility = "visible";
    }
  }

  function animate() {
    console.log("animate called");
    animationDone = false;
    const evalWindow = 1;
    const reqPerMin = 500;

    monitorConfigDiv.innerHTML = `Monitor evaluation window: ${evalWindow} minute. Monitor alert threshold: <${100 * alertThreshold} %.`
    observedDiv.innerHTML = `Requests/minute: ${reqPerMin}. Average success rate: ${100 * successRate} %.`

    canvasDetail.style.visibility = "hidden";
    rerunButton.style.visibility = "hidden";
    progressResultDiv.innerHTML = 'Randomly distributing bad requests...';

    const ctx = canvas.getContext("2d");


    for (let m = 0; m < minutes.length; m++) {
      minutes[m] = {
        good: reqPerMin,
        total: reqPerMin,
        trailingGood: evalWindow * reqPerMin,
        trailingTotal: evalWindow * reqPerMin,
      }
    }

    const totalRequest = minutes.length * reqPerMin;

    // inject random errors
    const errorCount = Math.floor(totalRequest * (1 - successRate));
    for (let e = 0; e < errorCount; e++) {
      const m = Math.floor(minutes.length * Math.random())
      minutes[m].good--;
      for (let wi = 0; wi < evalWindow && m + wi < minutes.length; wi++) {
        minutes[m + wi].trailingGood--;
      }
    }

    // animate monitor bar
    let m = 0;
    let goodMinutes = 0;
    const timerId = setInterval(() => {
      for (j = 0; j < 10 && m < minutes.length; j++, m++) {
        const val = minutes[m].trailingGood / minutes[m].trailingTotal;

        if (val >= alertThreshold) {
          goodMinutes++;
          ctx.fillStyle = "green";
          // console.log(`${m} is green`);
        } else {
          ctx.fillStyle = "red";
        }
        ctx.fillRect(m, 0, 1, 40);
      }

      if (m >= minutes.length) {
        clearInterval(timerId);
        animationDone = true;

        progressResultDiv.innerHTML = `<b>Uptime</b>: ${100 * goodMinutes / minutes.length} %.`;
        rerunButton.style.visibility = "visible";

        canvas.addEventListener("mousemove", inspect);
      }
    }, 1)
  }

  animate();
}