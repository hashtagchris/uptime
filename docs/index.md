---
layout: page
title: Uptime on a good day
---
It's Sunday, and all is quiet. No one's shipping changes to your site. Traffic is low. So what will your uptime be?

## SLO configuration

I'll assume we're using DataDog. First we'll create [DataDog metric monitors](https://docs.datadoghq.com/monitors/types/metric/?tab=threshold) for specific services. Our monitors will calculate `good requests / total requests` and compare the value to an alert threshold. What constitues a "good" request or operation is up to you. It might be based on successful request processing, latency, successful processing _and_ latency, or some other metric.

After we have our metric monitors set up, we'll create a [DataDog monitor uptime SLO](https://docs.datadoghq.com/service_management/service_level_objectives/monitor/).

If you set up your uptime monitoring differently, some of the lessons below may not apply.

## Lesson 1: There's no partial credit

Let's say your monitor's alert threshold is set to 99%, and your service's average reliability on a good day is 95%. Check out what that means for your uptime.

<canvas id="c1" height=50 width=1000></canvas>
<div id="canvasDetail1" style="position: fixed; background: white; border:1px solid black; justify-content: center">
    <div id="minute1" style="text-align: center;">Minute N</div>
    <table style="margin-bottom: 0px;">
        <tr><th>Good requests</th><td id="good1">500</td></tr>
        <tr><th>Total requests</th><td id="total1">500</td></tr>
        <tr><th>Monitor value</th><td id="valueOuter1" style="font-weight: bold;"><div id="valueInner1" style="background: white; margin: 5px">N % </div></td></tr>
    </table>
</div>
<div id="m1"></div>
<div id="o1"></div>
<div id="progressResult1"></div>
<button id="b1">🔄</button>

<script>
const alertThreshold = 0.98;

const monitorConfigDiv = document.getElementById("m1");
const observedDiv = document.getElementById("o1");
const progressResultDiv = document.getElementById("progressResult1");
const rerunButton = document.getElementById("b1");
const canvas = document.getElementById("c1");
const canvasDetail = document.getElementById("canvasDetail1");

rerunButton.addEventListener("click", animate);
canvas.addEventListener("mousemove", inspect);
canvas.addEventListener("mouseout", () => {
    canvasDetail.style.visibility = "hidden";
});

const minutes = Array(1000);
let animationDone;

function animate() {
    console.log("animate called");
    animationDone = false;
    const evalWindow = 1;
    const reqPerMin = 500;
    const successRate = 0.98;

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
                console.log(`${m} is green`);
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

function inspect(event) {
    // console.log(`x: ${event.x}, clientX: ${event.clientX}, layerX: ${event.layerX}, screenX: ${event.screenX}, pageX: ${event.pageX}, offsetX: ${event.offsetX}`)
    if (animationDone && event.offsetX >= 0 && event.offsetX < minutes.length) {
        const m = event.offsetX;

        document.getElementById("minute1").innerHTML = `Minute ${m}`;
        document.getElementById("good1").innerHTML = minutes[m].trailingGood;
        document.getElementById("total1").innerHTML = minutes[m].trailingTotal;

        const val = minutes[m].trailingGood / minutes[m].trailingTotal;
        document.getElementById("valueInner1").innerHTML = `${(100 * val).toFixed(2)} %`;
        document.getElementById("valueOuter1").style.background = val >= alertThreshold ? "green" : "red";

        canvasDetail.style.left = `${event.pageX}px`;
        canvasDetail.style.top = `${canvas.pageY + 10}px`;
        canvasDetail.style.visibility = "visible";
    }
}

animate()
</script>
