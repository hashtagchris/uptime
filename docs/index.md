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
{% include slo-animation.html successRate='0.98' alertThreshold='0.99' %}

### Example 2
Even if your service's average reliability is 99%, if that's also your monitor's alert threshold, your uptime will be roughly 50%:

{% include slo-animation.html successRate='0.99' alertThreshold='0.99' %}

### Example 3
This pass/fail behavior can also work in your favor. If your service's average reliability is 99.9%, and your monitor's alert threshold is just 99%, your uptime on good days will likely be 100% (infinite nines):

{% include slo-animation.html successRate='0.999' alertThreshold='0.99' %}
