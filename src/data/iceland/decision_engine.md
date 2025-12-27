# Iceland Itinerary Decision Engine v1

## Overview

This document defines the rules and constraints that govern itinerary generation.
The AI must follow these rules - they encode travel planning expertise.

---

## 1. PACING DEFINITIONS

### 1.1 Relaxed Pace
**Philosophy:** "Quality over quantity. Savor each moment."

| Constraint | Value |
|------------|-------|
| Max activities per day | 2 (1 major + 1 minor OR 2 minor) |
| Max spots per day | 2-3 |
| Max driving per day | 2.5 hours total |
| Max single drive | 1.5 hours |
| Buffer between activities | 45+ minutes |
| Required downtime | 2+ hours midday OR evening free |
| Breakfast | Leisurely (depart 9:30-10am) |
| Dinner | Always sit-down, book ahead |
| Evening activity | Optional, max 1 per trip |

**Day Shape (Relaxed):**
```
09:30 - Depart accommodation (after slow breakfast)
10:30 - Morning spot (1.5-2 hrs, the "main event")
12:30 - Scenic drive or small stop
13:00 - Long lunch (1-1.5 hrs, sit-down)
14:30 - Afternoon option: 
        - Gentle walk/scenic spot (1 hr) OR
        - Free time / hot spring / rest
16:00 - Drive to accommodation area
17:00 - Check in, rest
19:00 - Nice dinner (reserved)
```

### 1.2 Balanced Pace
**Philosophy:** "See the highlights without exhaustion."

| Constraint | Value |
|------------|-------|
| Max activities per day | 3 (1 major + 2 minor OR 2 major) |
| Max spots per day | 4-5 |
| Max driving per day | 4 hours total |
| Max single drive | 2 hours |
| Buffer between activities | 30 minutes |
| Required downtime | 1 hour midday OR 1 free evening per 3 days |
| Breakfast | Moderate (depart 8:30-9am) |
| Dinner | Mix of casual and sit-down |
| Evening activity | 1-2 per week max |

**Day Shape (Balanced):**
```
08:30 - Depart accommodation
09:30 - First spot (45 min - 1.5 hrs)
11:00 - Second spot or scenic stop (30-45 min)
12:00 - Drive + quick stop
13:00 - Lunch (45 min - 1 hr)
14:00 - Main afternoon activity (1.5-2.5 hrs)
16:30 - Optional small stop or direct to area
17:30 - Arrive accommodation area
18:00 - Rest / explore town
19:30 - Dinner
```

### 1.3 Packed Pace  
**Philosophy:** "Maximize every moment. Sleep when you're home."

| Constraint | Value |
|------------|-------|
| Max activities per day | 4 (2 major + 2 minor) |
| Max spots per day | 6-7 |
| Max driving per day | 5.5 hours total |
| Max single drive | 2.5 hours |
| Buffer between activities | 15 minutes |
| Required downtime | 1 free evening per 5 days |
| Breakfast | Quick (depart 7:30-8am) |
| Dinner | Efficient, can be casual |
| Evening activity | 2-3 per week OK |

**Day Shape (Packed):**
```
07:30 - Depart accommodation (early breakfast or packed)
08:30 - First spot (golden hour photography)
09:30 - Second spot
10:30 - Quick scenic stop
11:00 - Drive
12:00 - Third spot or activity (1.5-2 hrs)
14:00 - Quick lunch (30-45 min, can be packed)
14:45 - Fourth spot
16:00 - Fifth spot or scenic stop
17:30 - Drive to accommodation
19:00 - Dinner (can be quick/casual)
20:30 - Optional: northern lights hunt / late sunset spot
```

---

## 2. ROUTING CONSTRAINTS

### 2.1 Accommodation Proximity
| Rule | Relaxed | Balanced | Packed |
|------|---------|----------|--------|
| First activity from hotel | ≤30 min | ≤45 min | ≤60 min |
| Last activity to hotel | ≤30 min | ≤45 min | ≤60 min |
| Hotel to dinner | ≤15 min | ≤20 min | ≤30 min |

### 2.2 Inter-Spot Distance
| Rule | Relaxed | Balanced | Packed |
|------|---------|----------|--------|
| Between consecutive spots | ≤30 min | ≤45 min | ≤60 min |
| Between activity and next spot | ≤20 min | ≤30 min | ≤45 min |
| Allowed exceptions per day | 0 | 1 | 2 |

### 2.3 Route Efficiency
```
RULE: No backtracking
- Day's route should form a logical path
- Never return to a region you left earlier that day
- Exception: returning to accommodation area at end of day

RULE: One direction per day
- South Coast: always east OR west, never both
- Ring Road: clockwise OR counter-clockwise
- Snaefellsnes: loop in one direction

RULE: Minimize dead-end detours
- If a spot requires >20 min detour from main route:
  - Relaxed: Skip unless it's an anchor
  - Balanced: Include only if major highlight
  - Packed: Include if time allows
```

### 2.4 Regional Day Planning
```
RULE: One region focus per day
- Each day should have a "home region"
- 70%+ of day's spots should be in home region
- Crossover to adjacent region OK for 1-2 spots

VALID day regions:
- Golden Circle (Þingvellir, Geysir, Gullfoss area)
- South Coast West (Seljalandsfoss to Vík)
- South Coast East (Vík to Höfn)
- Glacier Lagoon (Skaftafell to Jökulsárlón)
- Snæfellsnes (whole peninsula)
- North (Mývatn, Húsavík, Akureyri)
- Reykjavik (city + nearby)
```

---

## 3. ACTIVITY SEQUENCING

### 3.1 Energy Management
```
RULE: Physical activity placement
- Strenuous activities: morning only (before 14:00)
- Challenging activities: morning preferred, early afternoon OK
- Moderate activities: anytime
- Easy activities: anytime, good for end of day

RULE: Recovery after exertion
- After strenuous activity: 2+ hour gap before next physical activity
- After challenging activity: 1+ hour gap
- After glacier hike: no more hikes that day
- After snorkeling/diving: warm activity next (hot spring, warm cafe)

RULE: Energy curve
Morning:   High energy activities
Midday:    Scenic stops, lunch, moderate activities  
Afternoon: Mix of easy/moderate, one more activity OK
Evening:   Relaxation, dining, optional gentle activity
```

### 3.2 Experience Variety
```
RULE: No repetition
- Max 2 waterfalls per day
- Max 1 glacier activity per day
- Max 2 "scenic viewpoint" type spots in a row
- If 2 similar experiences, separate by 2+ hours

RULE: Type mixing
Good day variety:
  ✓ Waterfall → Cultural site → Activity → Scenic viewpoint
  ✓ Nature walk → Town → Hot spring → Dinner

Bad day variety:
  ✗ Waterfall → Waterfall → Waterfall
  ✗ Viewpoint → Viewpoint → Viewpoint → Viewpoint
  
RULE: Sensory balance
- Balance "active looking" with "active doing"
- After 3 "looking" spots, include a "doing" activity
- Examples of "doing": hot spring, hike, activity, town walk, meal
```

### 3.3 Optimal Timing
```
RULE: Time-sensitive spots
| Spot/Activity | Best Time | Avoid |
|---------------|-----------|-------|
| Þingvellir | Before 10am | 11am-2pm (tour buses) |
| Geysir | Anytime | - |
| Gullfoss | 10am-4pm | - |
| Skógafoss | Before 9am | Midday in summer |
| Reynisfjara | Afternoon | High tide times |
| Jökulsárlón | Golden hour | Midday (flat light) |
| Blue Lagoon | Evening | 10am-2pm |
| Kirkjufell | Sunrise/sunset | Midday |
| Dyrhólaey puffins | Evening | Midday |

RULE: Crowd avoidance by pacing
- Relaxed: Can hit popular spots at peak (fewer spots anyway)
- Balanced: Aim for shoulder times (9-10am, 4-5pm)
- Packed: Must hit popular spots early (before 9am)

RULE: Golden hour usage
- Photographers: prioritize photogenic spots at golden hour
- Families: golden hour less critical
- If anchor is photography-focused: schedule for optimal light
```

---

## 4. TRAVELER TYPE ADJUSTMENTS

### 4.1 Solo Travelers
```
Base: Use standard pacing rules
Adjustments:
- Can be more flexible with timing
- Single portions at restaurants (faster)
- More hostel/guesthouse options
- Evening activities encouraged (social)
```

### 4.2 Couples
```
Base: Use standard pacing rules
Adjustments:
- Prioritize romantic spots (hot springs, scenic dinners)
- Private experiences over group tours when possible
- Include 1-2 "special" dinners (Friðheimar, nice Reykjavik restaurant)
- Photography spots at golden hour
```

### 4.3 Friends Groups (2-6)
```
Base: Use standard pacing rules
Adjustments:
- Can push toward packed (more energy)
- Include group activities (ATV, rafting, pub)
- Larger vehicle considerations (timing)
- Split-interest flexibility ("you do glacier, we do lagoon")
```

### 4.4 Families with Young Children (under 8)
```
Base: Force RELAXED pacing regardless of selection
Hard constraints:
- Max 3 spots per day
- Max 2 hours driving without break
- Nap time: 13:00-15:00 should be drive or accommodation
- Meal times: 12:00, 17:30 (can't push late)
- Back to accommodation by 18:00

Adjustments:
- Prioritize: Friðheimar, easy waterfalls, whale watching
- Avoid: Reynisfjara (dangerous), challenging hikes, long activities
- Hot springs: only family-friendly ones
- Always have snack/bathroom stops planned
```

### 4.5 Families with Teens (13-17)
```
Base: Can use BALANCED or PACKED
Adjustments:
- Include adventure activities (ATV, glacier hike, snorkeling)
- Teens sleep late: don't schedule before 9am starts
- Budget for activity costs (expensive with teens)
- Include some "cool" photo spots (plane wreck, Reynisfjara)
```

### 4.6 Multi-generational
```
Base: Force RELAXED pacing
Hard constraints:
- Physical level: Easy or Moderate only
- Max 2.5 hours driving per day
- Accessible accommodations
- Sit-down meals only

Adjustments:
- Split group activities when needed
- Always have easy alternatives
- Hot springs are great equalizers
- Scenic viewpoints over hikes
```

### 4.7 Mobility Considerations
```
If mobility_limited in best_for required:
- Only include spots tagged with mobility_limited
- Skip anything requiring >500m walk on uneven terrain
- Prioritize: Geysir, Gullfoss (upper viewpoint), Reynisfjara (car park view)
- Avoid: Svartifoss, Reykjadalur, Fjaðrárgljúfur
```

---

## 5. ANCHOR FULFILLMENT

### 5.1 Anchor Placement Rules
```
RULE: Distribute anchors across trip
- Don't cluster all anchors in first 3 days
- Each anchor should have 2+ opportunities in itinerary
- Primary anchor experience: place at optimal time
- Backup anchor experience: different day, in case of weather

RULE: Anchor priority by trip length
3-5 days:  Max 2 anchors, focus deeply
6-9 days:  Max 3 anchors, good coverage
10-14 days: 3-4 anchors, can add variety
15+ days:  All anchors possible
```

### 5.2 Weather Contingency
```
RULE: Weather-critical anchor backup
For each weather_critical anchor experience:
- Identify a backup day later in trip
- Have an indoor/weather_resistant alternative for that slot

Example:
- Primary: Northern lights tour Day 3
- Backup: Northern lights tour Day 6
- Slot filler if both fail: Perlan northern lights exhibit

RULE: Flexible day placement
- Don't lock northern lights to specific day until D-1
- Keep one "flex day" with moveable activities
- Mark certain days as "weather dependent, confirm morning of"
```

### 5.3 Anchor-Specific Rules

**Northern Lights:**
```
- Only September-March
- Place on clear-forecast nights
- Schedule after 21:00
- Don't schedule tiring day before (need to stay up late)
- Location: away from Reykjavik light pollution
- Backup: multiple nights, can rebook
```

**Glaciers:**
```
- Activity required (glacier hike, ice cave, snowmobile)
- Just seeing glacier from distance doesn't fulfill anchor
- Book 2-3 days ahead
- Morning slots preferred
- Have same-day backup (different operator) if cancelled
```

**Waterfalls:**
```
- Easy to fulfill (many options)
- Include variety: walkable behind (Seljalandsfoss), powerful (Gullfoss), remote (Dynjandi)
- Can experience in any weather (some enhanced by rain)
```

**Hot Springs:**
```
- Include both: commercial (Blue Lagoon/Sky Lagoon) AND natural option
- Place after physical activities (recovery)
- Evening slots often better (atmosphere, availability)
- Book commercial ones 2+ weeks ahead
```

**Wildlife:**
```
- Whale watching: morning preferred (calmer seas)
- Puffins: May-August ONLY, evening for activity
- Seals: Jökulsárlón area, no booking needed
- Book whale watching 1-2 days ahead
```

---

## 6. ACCOMMODATION STRATEGY

### 6.1 Location Rules
```
RULE: Stay near next morning's first stop
- Accommodation should be ≤45 min from first activity next day
- Exception: if no options exist (remote areas)

RULE: Multi-night stays
- Relaxed: Prefer 2-night stays, max 3 different accommodations per week
- Balanced: Mix of 1 and 2-night stays
- Packed: 1-night stays OK, minimize packing/unpacking

RULE: Hub strategy for longer trips
- Use Reykjavik as hub (2-3 nights, day trips)
- Use Vík/Kirkjubæjarklaustur as South Coast hub
- Use Akureyri as North hub
- Avoid one-night stands in remote locations when possible
```

### 6.2 Type by Traveler
```
| Traveler Type | Recommended | Avoid |
|---------------|-------------|-------|
| Solo | Hostels, guesthouses | Expensive hotels |
| Couple | Boutique hotels, cabins | Hostels |
| Friends | Airbnb houses, hostels | Small B&Bs |
| Family (young) | Apartments, family rooms | Hostels, shared bath |
| Family (teens) | Airbnb, connecting rooms | Single rooms |
| Multi-gen | Hotels with accessibility | Remote cabins |
```

---

## 7. MEAL PLANNING

### 7.1 Meal Timing
```
| Meal | Relaxed | Balanced | Packed |
|------|---------|----------|--------|
| Breakfast | 08:30-09:30 (sit-down) | 08:00-08:30 | 07:00-07:30 (quick/packed) |
| Lunch | 12:30-14:00 (1+ hr) | 12:00-13:00 (45 min) | 12:00-12:30 (30 min) |
| Dinner | 19:00-21:00 | 19:00-20:30 | 18:30-19:30 |
```

### 7.2 Meal Strategy
```
RULE: One "nice" meal per day
- Even packed pace should have one sit-down meal
- Rotate: nice breakfast OR nice lunch OR nice dinner

RULE: Grocery stops
- Plan grocery stop every 2-3 days
- Stock up in: Reykjavik, Selfoss, Vík, Akureyri, Egilsstaðir
- Essential for budget travelers and remote areas

RULE: Restaurant reservations
- Friðheimar: Always book ahead
- Reykjavik nice restaurants: Book 2-3 days ahead
- Remote areas: Check if open (seasonal closures)

RULE: Budget tier impact
| Budget | Strategy |
|--------|----------|
| Budget | Self-catering most meals, occasional cafe |
| Moderate | Mix of self-catering and restaurants |
| Comfort | Restaurants daily, 1-2 special meals |
| Luxury | All restaurant, multiple special meals |
```

---

## 8. COST ESTIMATION

### 8.1 Daily Base Costs (USD, 2 people)
```
| Category | Budget | Moderate | Comfort | Luxury |
|----------|--------|----------|---------|--------|
| Accommodation | $80-120 | $150-200 | $250-350 | $400+ |
| Food | $40-60 | $80-120 | $150-200 | $250+ |
| Fuel | $30-50 | $30-50 | $30-50 | $30-50 |
| Activities | $0-50 | $50-150 | $150-250 | $250+ |
| **Daily Total** | $150-280 | $310-520 | $580-850 | $930+ |
```

### 8.2 Activity Pricing Rules
```
RULE: Activity budget per day
| Pacing | Budget | Moderate | Comfort | Luxury |
|--------|--------|----------|---------|--------|
| Relaxed | $0-30 | $50-100 | $100-150 | $200+ |
| Balanced | $0-50 | $80-150 | $150-200 | $300+ |
| Packed | $50-100 | $100-200 | $200-300 | $400+ |

RULE: "Big ticket" activities
- Glacier hike, ice cave, snorkeling: once per trip is enough
- Don't stack expensive activities on same day
- Space big-ticket items across trip
```

---

## 9. ITINERARY VALIDATION CHECKLIST

Before finalizing any itinerary, verify:

### Logistics
- [ ] Total driving time within pacing limit
- [ ] No single drive exceeds limit  
- [ ] No backtracking
- [ ] Accommodation near day's end point
- [ ] Gas station on route if needed (check routes.json)

### Experience
- [ ] All anchors fulfilled (with backups)
- [ ] No more than 2 similar experiences in a row
- [ ] Mix of activity types each day
- [ ] At least one "wow" moment per day
- [ ] Rest/downtime included per pacing rules

### Timing
- [ ] Time-sensitive spots at optimal times
- [ ] Activities booked for appropriate slots
- [ ] Meal times realistic
- [ ] Evening activities don't conflict with dinner

### Traveler Fit
- [ ] Physical levels match traveler capability
- [ ] Best_for tags align with traveler type
- [ ] Kid-friendly if children present
- [ ] Accessible if mobility limited

### Budget
- [ ] Estimated daily costs within tier
- [ ] No more than 1 "big ticket" per day
- [ ] Free activities balanced with paid

### Safety
- [ ] No dangerous spots for this traveler type
- [ ] Weather-critical items have alternatives
- [ ] Reynisfjara warning included if visiting
- [ ] F-roads avoided unless 4x4 confirmed

---

## 10. GENERATION ALGORITHM (High-Level)

```
1. INPUT: dates, travelers, pacing, anchors, budget

2. DETERMINE STRUCTURE:
   - Calculate trip length
   - Assign regions to days based on logical flow
   - Place arrival/departure days
   
3. FULFILL ANCHORS:
   - For each anchor, identify best day/time
   - Place primary experience
   - Place backup experience different day
   
4. FILL DAYS:
   For each day:
   a. Start with region's "must see" spots
   b. Apply pacing constraints (max spots, max driving)
   c. Apply energy curve (hard activities morning)
   d. Apply variety rules (no waterfall after waterfall)
   e. Add meals at appropriate times
   f. Verify routing makes sense (no backtracking)
   g. Add buffer time per pacing level
   
5. VALIDATE:
   - Run checklist from Section 9
   - Fix any violations
   
6. OPTIMIZE:
   - Adjust timing for time-sensitive spots
   - Swap similar spots for better routing
   - Balance daily intensity across trip
   
7. OUTPUT:
   - Full itinerary with times
   - Booking reminders (what needs advance booking)
   - Alternatives for weather-dependent items
```

---

## APPENDIX: Quick Reference Tables

### A. Pacing Cheat Sheet
| | Relaxed | Balanced | Packed |
|-|---------|----------|--------|
| Wake up | 8:30am | 7:30am | 6:30am |
| First activity | 10:00am | 9:00am | 8:00am |
| Spots per day | 2-3 | 4-5 | 6-7 |
| Activities per day | 1-2 | 2-3 | 3-4 |
| Max driving | 2.5 hrs | 4 hrs | 5.5 hrs |
| Evening free | Daily | 2x/week | 1x/week |

### B. Regional Day Suggestions
| Region | Min Days | Relaxed | Balanced | Packed |
|--------|----------|---------|----------|--------|
| Golden Circle | 1 | 2 days | 1 day | 1 day |
| South Coast (full) | 2 | 4 days | 3 days | 2 days |
| Snæfellsnes | 1 | 2 days | 1.5 days | 1 day |
| North (Mývatn area) | 1 | 2 days | 1.5 days | 1 day |
| Reykjavik | 0.5 | 2 days | 1 day | 0.5 day |
| East Fjords | 0.5 | 2 days | 1 day | 0.5 day |
| West Fjords | 2 | 4+ days | 3 days | 2 days |

### C. Cannot Combine (Same Day)
- Snæfellsnes + South Coast
- North + South Coast  
- West Fjords + anything else
- Two major activities (glacier hike + snorkeling)
- Two strenuous hikes