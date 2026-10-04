

# **Milkline Frontend Take-Home**

Summary: Design and build one screen: the herd overview a dairy farmer opens at 5am in a barn. Four to five hours, hard cap. We would rather see how you think than how much you can produce.

## **The context**

Milkline puts continuous IoT sensors on dairy cattle and turns the stream into health and performance signals at the level of the individual animal. The hardware is field-proven and the algorithms are validated. We are now building the interface.

Three people use the same platform, and they could not be more different:

| User | Where they are | What they need in the first five seconds |
| :---- | :---- | :---- |
| Farmer | In the barn at 5am, phone in one hand, gloves on, poor signal | Which animals need me today, and where are they |
| Vet | At a desk, reviewing dozens of farms | Which farms are drifting, and which animals justify a visit |
| Geneticist | At a desk, working across the whole population | Trends and cohorts, not individuals |

**This task is about the farmer.** Of the three they are more complex, because the conditions are the worst and the tolerance for a confusing screen is zero.

## **The brief**

Design and build the **herd overview**, the first screen the farmer sees when they open the app.

A herd is 60 to 400 animals. Each one streams vitals continuously. On any given morning, three to eight animals need attention and the rest are fine. The screen's job is to make that distinction obvious before the farmer has finished reading it.

### **The conditions it has to survive**

These are the real constraints, and they are the point of the exercise:

1. **One hand, gloves on.** Touch targets and gestures have to work for someone holding a phone badly.  
2. **Bad light, both directions.** Pre-dawn dark, then direct sun an hour later.  
3. **Signal comes and goes.** The barn has patchy coverage. The screen must be useful when the connection drops mid-session and must never lie about how fresh its data is.  
4. **The farmer is not an analyst.** No complex chart and data viz to interpret. No number without a meaning attached to it.

### **What the screen must let them do**

* See briefly how the herd is doing overall and whether anything is wrong  
* Identify the animals needing attention today, in priority order, and see why each was flagged  
* Open one animal for a closer look (the detail view itself is out of scope, the entry point is not)  
* Find a specific animal by tag number

Everything beyond that list is your call. **What you choose to leave out matters as much as what you put in**. Tell us about those decisions in the rationale.

## **The API you'll build against**

This is a simplified stand-in for the real Milkline API, shaped the same way. Mock it however you like — MSW, a JSON file, a tiny Express server, whatever costs you least time. Generate your own herd data; 120 animals is a reasonable size to design against.

### **GET /api/v1/herds/{herdId}/animals**

Returns the herd. Paginated, 50 per page.

{  
  "herdId": "h\_4417",  
  "page": 1,  
  "pageSize": 50,  
  "total": 120,  
  "asOf": "2026-09-18T04:52:11Z",  
  "animals": \[  
    {  
      "id": "a\_00231",  
      "tag": "IT042-0231",  
      "name": "Greta",  
      "lactationDay": 87,  
      "status": "attention",  
      "statusSince": "2026-09-18T02:10:00Z",  
      "flags": \[  
        { "code": "RUMINATION\_DROP", "severity": "high", "detectedAt": "2026-09-18T02:10:00Z", "confidence": 0.91 },  
        { "code": "ACTIVITY\_LOW", "severity": "medium", "detectedAt": "2026-09-18T03:40:00Z", "confidence": 0.74 }  
      \],  
      "vitals": {  
        "ruminationMinutes24h": 291,  
        "ruminationBaseline": 468,  
        "activityIndex": 38,  
        "activityBaseline": 71,  
        "bodyTempC": 39.4,  
        "yieldLitres24h": 21.2,  
        "yieldBaseline": 29.8  
      },  
      "location": { "zone": "Barn 2 · Pen C", "lastSeen": "2026-09-18T04:48:00Z" },  
      "sensor": { "battery": 0.62, "lastContact": "2026-09-18T04:48:00Z" }  
    }  
  \]  
}  
status is one of healthy, watch, attention, critical, no\_signal.

severity is one of low, medium, high.

flags\[\].code is one of RUMINATION\_DROP, ACTIVITY\_LOW, ACTIVITY\_SPIKE, TEMP\_HIGH, YIELD\_DROP, HEAT\_DETECTED, CALVING\_IMMINENT, SENSOR\_SILENT.

### **WS /api/v1/herds/{herdId}/stream**

Pushes a message every two to five seconds. Most are routine; a flag\_raised arrives every minute or so.

{ "type": "vitals\_update", "animalId": "a\_00231", "at": "2026-09-18T04:53:02Z",  
  "vitals": { "activityIndex": 41, "bodyTempC": 39.5 } }

{ "type": "flag\_raised", "animalId": "a\_00877", "at": "2026-09-18T04:53:40Z",  
  "flag": { "code": "TEMP\_HIGH", "severity": "high", "confidence": 0.88 },  
  "statusChangedTo": "critical" }

{ "type": "flag\_cleared", "animalId": "a\_00512", "at": "2026-09-18T04:54:01Z",  
  "flagCode": "ACTIVITY\_LOW", "statusChangedTo": "healthy" }

{ "type": "sensor\_offline", "animalId": "a\_00104", "at": "2026-09-18T04:54:30Z" }

### **Please make these happen at least once**

We want to see how the interface behaves when things go wrong, so build the failures in and show them to us:

* The initial fetch is slow (two seconds or more)  
* The initial fetch fails outright  
* Lost network connection

## **What to hand back**

Three things. Budget roughly 1.5 hours of design, 2.5 hours of code, 30 minutes of writing — adjust to suit how you work, but do not skip any of the three.

### **1\. A Figma file**

* The herd overview, responsive, in whichever state you consider the default  
* **Any alternative direction you considered and rejected**, even if rough. We care more about this than about polish on the winner.  
* The beginnings of a design system: the colour tokens that encode animal status, type scale, spacing, and the one or two components you would build first  
* Light or dark, if you get to it. If not, say which you designed for and why.

Messy layers are fine. We will not open the layers panel.

### **2\. Running code**

* React or Next, with TypeScript. Any tooling you like.  
* The herd overview, live against your mock API  
* Real loading, empty, error, offline and stale states — not placeholders  
* A README with how to run it, what you did not finish, and what you would do next

Build it as a web app. If you prefer React Native, that is fine too — say so in the README.

### **3\. A rationale, one page maximum**

This carries more weight than either of the other two. Cover:

* The decision you found hardest, and how you resolved it  
* What you deliberately left out, and why  
* What updates live on the screen, what does not, and the reasoning  
* How you would know, once it shipped, whether the design was working  
* What you would do with the next twenty hours

## **Out of scope**

Do not spend time on any of this. It will not earn you anything:

* Authentication, onboarding, settings, navigation shell  
* The animal detail view, the vet console, the geneticist view  
* Tests beyond whatever you would naturally write  
* A real backend, or deployment  
* Internationalization (we will talk about it, but do not build it)  
* Pixel-perfect polish anywhere

## **Ground rules**

**Use AI tools.** Claude, Copilot, Cursor, whatever you normally reach for. We use them daily and we are not interested in a version of you working with one hand tied. Tell us in the README where they helped and where you overrode them, that judgement is what we are actually reading.

**Four to five hours is a cap, not a target.** If you are at the cap with something unfinished, stop and write down what you would have done. We would far rather read that than receive a polished submission that took you fourteen hours. No need for going over, and we ask directly in the interview.

There is no Milkline design language yet, that is partly what this hire decides. **Invent whatever visual direction you think the product should have.**

**Ask questions.** Email dev@milkline.com at any point. Asking a good question about the barn, the animals or the users counts in your favor, not against it.

## **How we'll evaluate**

The whole rubric, so you can spend your hours where they count:

| What we look at | Weight | What a strong answer looks like |
| :---- | :---- | :---- |
| Design judgement | 30% | The screen answers "what needs me today" before it is read. Hierarchy earns its keep. The rejected direction shows real thinking, not a colour swap. |
| Handling live and unreliable data | 25% | Deliberate choices about what updates and what holds still. Stale, offline and failed states are designed, not bolted on. Never misleads about freshness. |
| Implementation quality | 20% | Components another engineer would reuse. Sane state and server-state handling. Readable under time pressure. |
| Design-to-code fidelity | 15% | The built thing is the designed thing. Tokens, not hard-coded hex. The system holds together across states. |
| The rationale | 10% | Honest about trade-offs and gaps. Clear about what was cut and why. Written for a colleague, not a grader. |

***We are not scoring you on visual polish, test coverage, commit hygiene, or how much you finished.***

### **After you submit**

A 45-minute call where you walk us through it. We will push on your decisions, that is the interesting part, not a trap. Expect to be asked what you would change now that you have slept on it, and how the same design stretches to the vet reviewing forty farms at once.

You will hear from us either way within five working days.