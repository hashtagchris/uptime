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
With an Uptime SLO, each minute is either red (0%) or green (100%). If one or more of your monitors is red, then you get zero credit for the successful requests in the evaluation window.

### Example 1
Let's say your monitor's alert threshold is set to 99%, your service's average reliability on a good day is 98%, and failed requests are distributed randomly. Your uptime will be less than 10%:

{% include slo-shared.html %}
{% include slo-animation.html successRate='0.98' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

### Example 2
Even if your service's average reliability is 99%, if that's also your monitor's alert threshold, your uptime will be roughly 50%:

{% include slo-animation.html successRate='0.99' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

### Example 3
This pass/fail behavior can also work in your favor. If your service's average reliability is 99.9%, and your monitor's alert threshold is just 99%, your uptime on good days will likely be 100% (infinite nines):

{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

## Sidebar: Using a random distribution
Is using a random distribution to model failed requests realistic? On a quiet day with no deploys, and the services you depend on not shipping changes either, I think it could be. If your service is publicly available and you haven't hardened it with fuzz testing, you might receive vulnerability scanning requests from bots that result in service errors at random times. And if you have a fairly reliable network, then the occasional `ECONNRESET` or dropped packet may be randomly distributed. If your service has internal retries on network errors, perhaps request latency will appear more random than failed request processing.

## Lesson 2: Each monitor you add impacts uptime
If there is no correlation across monitors, monitor downtime is almost additive. You can see the effect on uptime below, scaling up from one monitor to six, where each monitor has 0-2% downtime. With six monitors you rarely have an uptime higher than 96%.

### One monitor
{% include slo-animation.html successRate='0.9965' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

### Two monitors
{% include slo-animation.html successRate='0.9965' alertThreshold='0.99' monitorCount='2' requestsPerMinute='100' evalWindowMinutes='5' %}

### Six monitors
{% include slo-animation.html successRate='0.9965' alertThreshold='0.99' monitorCount='6' requestsPerMinute='100' evalWindowMinutes='5' %}

## Lesson 3: The evaluation window affects uptime
Ideally it takes multiple failed requests to turn a monitor red, even during low usage periods. For some services, that may require a long evaluation window. Here are a few examples using an alert threshold of &lt;99%, with a service that has an average success rate of 99.9% and just four requests a minute.

### 100 requests per evaluation window
{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='4' evalWindowMinutes='25' %}

### 96 requests per evaluation window
The worst case scenario is the evaluation window having _almost_ the number of requests where it would take multiple failed requests to turn a monitor red. For an alert threshold of &lt;99%, that's slightly less than 100 requests/window.

Look at the drop in uptime when we go down to 96 requests per window:

{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='4' evalWindowMinutes='24' %}

### 4 requests per evaluation window
If you're unwilling to extend the evaluation window so it takes multiple failed requests to turn the monitor red, then uptime will be improved by shortening the evaluation window to one minute, so a failed request results in just one red minute:

{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='4' evalWindowMinutes='1' %}
