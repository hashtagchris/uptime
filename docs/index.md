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
<div id="r1" style="visibility: hidden"></div>
<button id="b1" style="visibility: hidden">🔄</button>

<script>
const resultDiv = document.getElementById("r1");
const rerunButton = document.getElementById("b1");
const canvas = document.getElementById("c1");

rerunButton.addEventListener("click", animate);

function animate() {
    console.log("animate called");

    resultDiv.style.visibility = "hidden";
    rerunButton.style.visibility = "hidden";

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, 1000, 40);

    let i = 0;
    let errors = 0;
    const timerId = setInterval(() => {
        for (j = 0; j < 10 && i < 1000; j++, i++) {
            if (Math.random() > 0.99) {
                console.log(i);
                errors++;
                ctx.fillStyle = "red";
                ctx.fillRect(i, 0, 10, 40);
            }
        }

        if (i >= 1000) {
            clearInterval(timerId);

            const successRate = 100 * ((1000 - errors) / 1000);

            resultDiv.innerHTML = `Success rate: ${successRate} %`;
            resultDiv.style.visibility = "visible";

            rerunButton.style.visibility = "visible";
        }
    }, 1)
}

animate()
</script>
