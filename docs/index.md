---
layout: page
title: Uptime on a good day
---
It's Sunday, and all is quiet. No one's shipping changes to your site. Traffic is low. So what will your uptime be? And how reliable do your services need to be to meet your uptime goal?

## SLO configuration

Assume we're using DataDog. First create [DataDog metric monitors](https://docs.datadoghq.com/monitors/types/metric/?tab=threshold) for specific services or APIs. Our monitors will calculate `good requests / total requests` and compare the value against an alert threshold. What constitutes a "good" request or operation is up to you. It might be based on successful request processing, latency, successful processing _and_ latency, or some other metric.

After our metric monitors are set up, create a [DataDog monitor uptime SLO](https://docs.datadoghq.com/service_management/service_level_objectives/monitor/).

If you set up your uptime monitoring differently, some of the lessons below may not apply.

## Lesson 1: There's no partial credit
With an Uptime SLO, each minute is either red (0%) or green (100%). If one or more of your monitors is red, then you get zero credit for the successful requests in the evaluation window. To have a good uptime, your service's average reliability needs to be significantly higher than your monitor's alert threshold.

### Example 1
Let's say your monitor's alert threshold is set to &lt;99%, your service's average reliability is 98%, and failed requests are distributed randomly. Despite processing 98% of requests successfully, your uptime will be less than 10%.

{% include slo-shared.html %}
{% include slo-animation.html successRate='0.98' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

### Example 2
Even if your service's average reliability is 99%, if that's also your monitor's alert threshold, your uptime will be roughly 50-60%.

{% include slo-animation.html successRate='0.99' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

### Example 3
This pass/fail behavior can also work in your favor. If your service's average reliability is 99.9%, and your monitor's alert threshold is "just" &lt;99%, your uptime on good days might be 100%. That leaves more minutes in your error budget, allowing you to ship more often.

{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

## Sidebar: Using a random distribution
Is using a random distribution to model failed requests realistic? On a day with no bad deploys from you or your dependencies, I think it could be. If your service is publicly available and you haven't hardened it with fuzz testing, vulnerability scanning requests from bots might result in service errors at random times. And if you have a fairly reliable network, then the occasional `ECONNRESET` or dropped packet may be randomly distributed. If your service has internal retries on network errors, perhaps request latency will appear more random than failed request processing.

## Lesson 2: Each additional monitor impacts uptime
If there is no correlation in failed requests across monitors, monitor downtime is almost additive. You can see the effect on uptime below, going from one monitor to six, where each monitor has 0-2% downtime. With six monitors you rarely have an uptime higher than 96%.

### One monitor
{% include slo-animation.html successRate='0.9965' alertThreshold='0.99' monitorCount='1' requestsPerMinute='100' evalWindowMinutes='5' %}

### Two monitors
{% include slo-animation.html successRate='0.9965' alertThreshold='0.99' monitorCount='2' requestsPerMinute='100' evalWindowMinutes='5' %}

### Six monitors
{% include slo-animation.html successRate='0.9965' alertThreshold='0.99' monitorCount='6' requestsPerMinute='100' evalWindowMinutes='5' %}

## Lesson 3: The evaluation window affects uptime
Ideally it takes multiple failed requests to turn a monitor red, even during low traffic periods. For some services, that may require a long evaluation window. Here are a few examples using an alert threshold of &lt;99%, with a service that has an average reliability of 99.9% and only four requests a minute.

### 100 requests per evaluation window
{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='4' evalWindowMinutes='25' %}

### 96 requests per evaluation window
The worst case scenario is the evaluation window having _almost_ the number of requests where it would take multiple failed requests to turn a monitor red. For an alert threshold of &lt;99%, that's slightly less than 100 requests/window.

Look what happens when we fall below 100 requests per evaluation window. Our service's reliability hasn't changed, but our uptime drops to 90-93%.

{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='4' evalWindowMinutes='24' %}

### 4 requests per evaluation window
If you're unwilling to extend a monitor's evaluation window so it takes multiple failed requests to turn the monitor red, then consider doing the opposite. Surprisingly, uptime will be improved by shortening the monitor evaluation window to one minute. That way a failed request results in just one red minute.

While this improves on the example above, you're unlikely to have 100% uptime if a single failed request results in a red minute. If a long evaluation window isn't an option, you'll need to improve your service's reliability to improve your uptime during low traffic periods.

{% include slo-animation.html successRate='0.999' alertThreshold='0.99' monitorCount='1' requestsPerMinute='4' evalWindowMinutes='1' %}

If the request rate differs greatly between peak and low traffic periods, you could use a [composite monitor](https://docs.datadoghq.com/monitors/types/composite/) and a second metric monitor to prevent a single failed request from impacting uptime during low traffic periods. But there are downsides to this approach:

* Composite monitors prevent the usage of [burn rate alerts](https://docs.datadoghq.com/service_management/service_level_objectives/burn_rate/) for your uptime SLO
* 2 additional monitors to manage, document and reason about, per low volume service

[View this page on GitHub](https://github.com/hashtagchris/uptime/blob/main/docs/index.md)