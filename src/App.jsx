import React, { useState, useEffect, useCallback } from "react";
import {
  User, Ruler, ArrowLeftRight, DoorOpen, MoveHorizontal, ShowerHead,
  ChefHat, BedDouble, ArrowUpDown, WashingMachine, Sofa, TreePine,
  Lightbulb, HeartHandshake, ShieldAlert, DollarSign, ChevronLeft,
  ChevronRight, Check, AlertTriangle, X, Home as HomeIcon, FileText, Lock
} from "lucide-react";

/* ---------------------------------------------------------------
   Palette + type tokens
   bg: soft warm paper, not the default cream/terracotta combo.
   accent: grounded sage (calm, not clinical or "medical green").
   gold: warm marker color for in-progress / attention.
   alert: muted brick, used only for safety flags — never bright red.
----------------------------------------------------------------*/
const C = {
  bg: "#F5F3EE",
  bgAlt: "#ECE7DC",
  panel: "#FFFFFF",
  ink: "#232B26",
  inkSoft: "#5C665F",
 inkFaint: "#6B726A",
  accent: "#3D6B5C",
  accentSoft: "#DEE7DF",
  accentLine: "#B9CBC0",
  gold: "#8F6A2C",
  goldSoft: "#F0E4C9",
  alert: "#9C4636",
  alertSoft: "#F1DFD8",
  line: "#DCD5C6",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`;

/* ---------------------------------------------------------------
   Section registry
----------------------------------------------------------------*/
const SECTION_META = [
  { id: "A", title: "About You", desc: "Who you are, how you move, and what matters most.", Icon: User },
  { id: "B", title: "Mobility Device Measurements", desc: "Real measurements for your device — not standard estimates.", Icon: Ruler },
  { id: "C", title: "Transfers and Positioning", desc: "How you move between surfaces, and the space that takes.", Icon: ArrowLeftRight },
  { id: "D", title: "Entrances, Steps & Ramps", desc: "Getting in, out, and around the outside of your home.", Icon: DoorOpen },
  { id: "E", title: "Hallways & Interior Movement", desc: "Doorways, turns, thresholds, and room-to-room flow.", Icon: MoveHorizontal },
  { id: "F", title: "Bathroom & Bathing Access", desc: "Toilet, shower, and bathing access and safety.", Icon: ShowerHead },
  { id: "G", title: "Kitchen Access", desc: "Counters, storage, appliances, and meal prep.", Icon: ChefHat },
  { id: "H", title: "Bedroom Access", desc: "Bed positioning, dressing, storage, nighttime safety.", Icon: BedDouble },
  { id: "I", title: "Stairs, Lifts & Floors", desc: "Moving between levels of your home.", Icon: ArrowUpDown },
  { id: "J", title: "Laundry & Household Tasks", desc: "Laundry, cleaning, and everyday chores.", Icon: WashingMachine },
  { id: "K", title: "Living, Dining & Office", desc: "Shared spaces for rest, work, and connection.", Icon: Sofa },
  { id: "L", title: "Outdoor Areas", desc: "Yards, decks, parking, and community access.", Icon: TreePine },
  { id: "M", title: "Home Controls & Technology", desc: "Lighting, locks, alerts, and smart-home access.", Icon: Lightbulb },
  { id: "N", title: "Caregiver & Medical Access", desc: "Space for assistance, therapy, and equipment.", Icon: HeartHandshake },
  { id: "O", title: "Emergency Planning", desc: "Evacuation, alerts, and disaster readiness.", Icon: ShieldAlert },
  { id: "P", title: "Budget & Contractor Readiness", desc: "Funding, documentation, and next steps.", Icon: DollarSign },
];

const SECTION_A_QUESTIONS = [
  { id: "a1", type: "text", prompt: "What should we call this assessment?", help: "e.g. “Mom's house” or “My apartment.” This just helps you find it later.", optional: true },
  { id: "a2", type: "select", prompt: "Who is this assessment for?", options: ["Myself", "A family member I'm supporting", "Someone I provide care for", "Our whole household"] },
  { id: "a3", type: "multiselect", prompt: "Which mobility devices do you use, if any?", options: ["Manual wheelchair", "Power wheelchair", "Scooter", "Walker", "Rollator", "Cane", "Crutches", "None", "Other"] },
  { id: "a4", type: "select", prompt: "Does your mobility or equipment change day to day, or over time?", options: ["Yes, often", "Yes, sometimes", "No, it's stable", "Not sure yet"] },
  { id: "a5", type: "select", prompt: "Do you need help from another person for any daily activities at home?", options: ["Yes, regularly", "Sometimes", "No", "Prefer not to answer"] },
  { id: "a6", type: "select", prompt: "Who typically provides that help?", options: ["Family member", "Hired caregiver", "Home health aide", "No one currently", "Prefer not to answer"], conditional: (a) => ["Yes, regularly", "Sometimes"].includes(a.a5) },
  { id: "a7", type: "multiselect", prompt: "Do you use any additional medical or safety equipment at home?", options: ["Oxygen equipment", "Hospital bed", "Patient lift", "Fall or safety monitor", "None", "Other"] },
  { id: "a8", type: "textarea", prompt: "What's the single biggest barrier in your home right now?", optional: true },
  { id: "a9", type: "select", prompt: "Are there areas of your home you avoid or can't use because of access problems?", options: ["Yes", "No", "Some, but I manage"] },
  { id: "a10", type: "multiselect", prompt: "Which areas are hardest to use?", options: ["Bathroom", "Kitchen", "Bedroom", "Entrance", "Stairs", "Laundry", "Outdoor space", "Other"], conditional: (a) => ["Yes", "Some, but I manage"].includes(a.a9) },
  { id: "a11", type: "select", prompt: "Has a fall, near-fall, or safety incident happened in your home in the past year?", options: ["Yes", "No", "Prefer not to answer"], safetyFlag: (v) => v === "Yes" },
  { id: "a12", type: "select", prompt: "What's motivating you to work on accessibility right now?", options: ["A safety concern", "An upcoming change in mobility", "Moving into this home", "Planning ahead", "A recent injury or diagnosis", "Other"] },
  { id: "a13", type: "select", prompt: "Do you rent or own this home?", options: ["Own", "Rent", "Other arrangement"] },
  { id: "a14", type: "textarea", prompt: "What's your overall goal for this project?", optional: true },
  { id: "a15", type: "textarea", prompt: "Anything else about your situation you'd like documented before we go further?", optional: true },
];

const SECTION_B_QUESTIONS = [
  { id: "b1", type: "select", prompt: "Which device are these measurements for?", options: ["Manual wheelchair", "Power wheelchair", "Scooter", "Walker", "Rollator", "Other"] },
  { id: "b2", type: "measurement", prompt: "Overall width of the device", help: "Measure the widest point, in its normal everyday configuration — including anything usually attached." },
  { id: "b3", type: "measurement", prompt: "Occupied width", help: "You, seated or positioned in the device — including elbows, hands on rims, or anything that extends past the frame." },
  { id: "b4", type: "measurement", prompt: "Hand clearance needed on each side while moving", help: "The extra space your hands need beyond the device's width." },
  { id: "b5", type: "measurement", prompt: "Overall length of the device" },
  { id: "b6", type: "measurement", prompt: "Overall height of the device" },
  { id: "b7", type: "measurement", prompt: "Seat height from the floor" },
  { id: "b8", type: "measurement", prompt: "Minimum turning space the device needs", help: "The diameter of space needed to turn around fully." },
  { id: "b9", type: "multiselect", prompt: "Which attachments affect clearance?", options: ["Joystick", "Footrests", "Leg supports", "Headrest", "Oxygen holder", "Storage bag or basket", "Anti-tip wheels", "Communication mount", "None", "Other"] },
  { id: "b10", type: "measurement", prompt: "Approximate combined weight of you and your device", help: "Only if you're comfortable sharing — this is used for structural and equipment planning, not as a judgment.", optional: true },
  { id: "b11", type: "measurement", prompt: "Do you know your device's weight capacity?", help: "If you're not sure, that's a completely normal answer.", optional: true },
  { id: "b12", type: "select", prompt: "Do you have front, side, rear, and close-up photos of your device and its attachments?", options: ["Yes, I have them", "Not yet", "I'll add them later"] },
  { id: "b13", type: "select", prompt: "Can your device photos be included in contractor-preparation materials, if you add them later?", options: ["Yes", "No", "I'll decide later"] },
  { id: "b14", type: "textarea", prompt: "Is there anything about your device setup that's hard to measure or explain?", optional: true },
];

const transfers = (a) => a.c1 !== "I don't transfer — I remain in my device";

const SECTION_C_QUESTIONS = [
  { id: "c1", type: "select", prompt: "How do you typically transfer between surfaces — like from your bed to a chair?", options: ["Independently", "With equipment (like a slide board or lift)", "With help from another person", "I don't transfer — I remain in my device", "Varies depending on the surface"] },
  { id: "c2", type: "multiselect", prompt: "Which transfer methods do you use?", options: ["Standing pivot", "Sliding or lateral transfer", "Transfer or slide board", "Mechanical or ceiling lift", "Squat pivot", "Other"], conditional: transfers },
  { id: "c3", type: "select", prompt: "Which direction do you typically transfer toward?", options: ["Either side equally", "Stronger side only — left", "Stronger side only — right", "Front-facing", "Varies"], conditional: transfers },
  { id: "c4", type: "select", prompt: "Do you need another person's help to transfer safely?", options: ["No, I transfer independently", "Sometimes, for certain transfers", "Yes, every time", "Prefer not to answer"], conditional: transfers },
  { id: "c5", type: "multiselect", prompt: "What kind of help do you need?", options: ["Standby assistance (someone nearby)", "Physical help with balance", "A full physical lift", "Setting up equipment", "Other"], conditional: (a) => transfers(a) && ["Sometimes, for certain transfers", "Yes, every time"].includes(a.c4) },
  { id: "c6", type: "measurement", prompt: "What's the height of the surface you transfer from most often?", help: "For example, your wheelchair or scooter seat.", conditional: transfers },
  { id: "c7", type: "measurement", prompt: "What's the height of the surface you transfer to most often?", help: "A height mismatch between surfaces is one of the most common causes of a difficult transfer.", conditional: transfers },
  { id: "c8", type: "measurement", prompt: "How much clear floor space do you need beside the transfer surface to position your device?", conditional: transfers },
  { id: "c9", type: "multiselect", prompt: "What transfer equipment do you use, if any?", options: ["Slide or transfer board", "Mechanical or ceiling lift", "Transfer pole or grab bar", "Gait belt", "Stand-assist device", "None", "Other"], conditional: transfers },
  { id: "c10", type: "select", prompt: "Does your positioning need adjusting after a transfer — cushions, straps, footrests, and so on?", options: ["Yes, every time", "Sometimes", "No", "Not sure"] },
  { id: "c11", type: "select", prompt: "If someone assists you, do they have enough space to stand and move safely beside you during the transfer?", options: ["Yes, plenty of space", "It's tight but workable", "No, there's not enough space", "Not applicable — I don't have an assistant"], conditional: transfers },
  { id: "c12", type: "select", prompt: "Has a transfer ever felt unsafe or unstable, or resulted in a fall or near-fall?", options: ["Yes", "No", "Prefer not to answer"], safetyFlag: (v) => v === "Yes" },
  { id: "c13", type: "multiselect", prompt: "Which transfers happen in your home right now?", options: ["Bed", "Toilet", "Shower or tub", "Chair or sofa", "Vehicle", "Office or desk chair", "Floor", "Other"] },
  { id: "c14", type: "textarea", prompt: "Is there a specific transfer in your home that's especially difficult or worrying?", optional: true },
  { id: "c15", type: "textarea", prompt: "Anything else about how you transfer or position yourself that's important to document?", optional: true },
];

const hasSteps = (a) => a.d4 === "Yes";
const hasRamp = (a) => a.d7 === "Yes, currently";

const SECTION_D_QUESTIONS = [
  { id: "d1", type: "select", prompt: "How many entrances does your home have that you could potentially use?", options: ["One", "Two", "Three or more", "Not sure"] },
  { id: "d2", type: "select", prompt: "Which entrance do you use most often?", options: ["Front door", "Back door", "Side door", "Garage entrance", "Other"] },
  { id: "d3", type: "select", prompt: "Is your main entrance currently accessible to you without help?", options: ["Yes", "No", "Only with help from another person", "Only in certain weather or conditions"] },
  { id: "d4", type: "select", prompt: "Are there steps at your main entrance?", options: ["Yes", "No", "Not sure"] },
  { id: "d5", type: "select", prompt: "How many steps are there?", options: ["1", "2", "3", "4 or more"], conditional: hasSteps },
  { id: "d6", type: "measurement", prompt: "What's the height (rise) of each step, roughly?", conditional: hasSteps },
  { id: "d7", type: "select", prompt: "Is there a ramp at any entrance?", options: ["Yes, currently", "No, but one could be added", "No, and there's no room for one", "Not sure"] },
  { id: "d8", type: "measurement", prompt: "What's the ramp's slope or length, if you know it?", help: "A rough estimate is fine — for example, feet of ramp per inch of rise.", conditional: hasRamp, optional: true },
  { id: "d9", type: "measurement", prompt: "What's the width of your main entrance doorway?", help: "Measure the clear opening — door open, frame to frame." },
  { id: "d10", type: "select", prompt: "Does the doorway have a threshold or lip you have to go over?", options: ["Yes, it's noticeable", "Yes, but it's minor", "No", "Not sure"] },
  { id: "d11", type: "select", prompt: "Is there a covered or level landing outside your main entrance to pause on?", options: ["Yes", "No", "Partial"] },
  { id: "d12", type: "select", prompt: "Can you reach your entrance from where a vehicle parks without crossing grass, gravel, or uneven ground?", options: ["Yes", "No", "Partially"] },
  { id: "d13", type: "multiselect", prompt: "Do any of these apply to your entrances?", options: ["Doorbell or lock is hard to reach", "Door is heavy or hard to open", "Lighting is poor at night", "Weather — rain, ice, or snow — makes it worse", "None of these"] },
  { id: "d14", type: "select", prompt: "If you needed to exit quickly in an emergency, could you do that independently through at least one entrance?", options: ["Yes", "No", "Not sure"], safetyFlag: (v) => v === "No" },
  { id: "d15", type: "select", prompt: "If you have a garage, can you access it from inside your home?", options: ["Yes", "No", "I don't have a garage"] },
  { id: "d16", type: "textarea", prompt: "Anything else about getting in or out of your home that's difficult or worth documenting?", optional: true },
];

const hasTurns = (a) => a.e4 && a.e4 !== "No";
const hasThresholds = (a) => a.e7 && a.e7 !== "No";
const hardToReach = (a) => a.e11 && a.e11 !== "Yes, all of them";

const SECTION_E_QUESTIONS = [
  { id: "e1", type: "measurement", prompt: "What's the width of your narrowest interior doorway?", help: "Measure the clear opening, door open, frame to frame." },
  { id: "e2", type: "select", prompt: "Which room does that narrowest doorway lead to?", options: ["Bathroom", "Bedroom", "Kitchen", "Closet", "Other"] },
  { id: "e3", type: "measurement", prompt: "What's the width of your main hallway?" },
  { id: "e4", type: "select", prompt: "Are there any tight turns you have to make while moving through your home?", options: ["Yes, several", "Yes, one or two", "No", "Not sure"] },
  { id: "e5", type: "measurement", prompt: "What's the tightest turning space you have to navigate?", help: "The diameter needed to turn, at the tightest point.", conditional: hasTurns },
  { id: "e6", type: "multiselect", prompt: "What type of flooring do you have throughout your home?", options: ["Hardwood", "Carpet", "Tile", "Laminate", "Vinyl", "Mixed — varies by room", "Other"] },
  { id: "e7", type: "select", prompt: "Are there thresholds or floor-level changes between rooms?", options: ["Yes, several", "Yes, a few", "No", "Not sure"] },
  { id: "e8", type: "measurement", prompt: "What's the height of the tallest threshold or floor transition?", conditional: hasThresholds },
  { id: "e9", type: "select", prompt: "Does carpet, a rug, or flooring ever catch your wheels, feet, or device as you move?", options: ["Yes, often", "Sometimes", "No", "Not applicable"], safetyFlag: (v) => v === "Yes, often" },
  { id: "e10", type: "multiselect", prompt: "Is furniture or clutter ever in the way as you move through your home?", options: ["Yes, in hallways", "Yes, in doorways", "Yes, in rooms I use often", "No, not really"] },
  { id: "e11", type: "select", prompt: "Can you reach every room you need to use on your own?", options: ["Yes, all of them", "Most of them", "Only some", "No"] },
  { id: "e12", type: "multiselect", prompt: "Which rooms are hardest to reach?", options: ["Bathroom", "Kitchen", "Bedroom", "Living room", "Laundry", "Other"], conditional: hardToReach },
  { id: "e13", type: "select", prompt: "If you needed to leave quickly in an emergency, could you move through your home to an exit without help?", options: ["Yes", "No", "Not sure"], safetyFlag: (v) => v === "No" },
  { id: "e14", type: "select", prompt: "Is there enough space in your hallways for someone to assist or walk beside you, if needed?", options: ["Yes", "It's tight but workable", "No", "Not applicable — I don't need assistance"] },
  { id: "e15", type: "textarea", prompt: "Is there a specific hallway, doorway, or room transition that's especially difficult?", optional: true },
  { id: "e16", type: "textarea", prompt: "Anything else about moving through your home that's worth documenting?", optional: true },
];

const usesOwnToilet = (a) => a.f3 !== "I use a different solution (e.g., a commode)";
const bathes = (a) => a.f7 && a.f7 !== "I don't currently bathe independently";

const SECTION_F_QUESTIONS = [
  { id: "f1", type: "measurement", prompt: "What's the width of your bathroom doorway?", help: "Measure the clear opening, door open." },
  { id: "f2", type: "select", prompt: "Can you close the bathroom door for privacy while using the space you need?", options: ["Yes", "No", "Only if I leave equipment outside", "Not applicable"] },
  { id: "f3", type: "select", prompt: "How do you get onto and off of the toilet?", options: ["Independently", "With grab bars or equipment", "With help from another person", "I use a different solution (e.g., a commode)", "Varies"] },
  { id: "f4", type: "measurement", prompt: "What's the height of your toilet seat?", conditional: usesOwnToilet },
  { id: "f5", type: "select", prompt: "Is there space beside the toilet for your device, or for someone assisting you?", options: ["Yes, plenty", "It's tight but workable", "No", "Not sure"], conditional: usesOwnToilet },
  { id: "f6", type: "multiselect", prompt: "What toilet-related equipment do you currently use, if any?", options: ["Grab bars", "Raised toilet seat", "Toilet safety frame", "Bidet or handheld attachment", "None", "Other"] },
  { id: "f7", type: "select", prompt: "How do you bathe most often?", options: ["Standing shower", "Shower with a seat or bench", "Bathtub", "Sponge bath or bed bath", "Varies", "I don't currently bathe independently"] },
  { id: "f8", type: "measurement", prompt: "What's the height of the step or curb into your shower or tub?", help: "A curb higher than expected is one of the most common bathing barriers.", conditional: bathes },
  { id: "f9", type: "select", prompt: "Is there a seat or bench in your shower or tub?", options: ["Yes, built-in", "Yes, portable", "No", "Not applicable"], conditional: bathes },
  { id: "f10", type: "select", prompt: "Can you reach the shower controls and showerhead from where you sit or stand to bathe?", options: ["Yes", "No", "Only with help"], conditional: bathes },
  { id: "f11", type: "multiselect", prompt: "What bathing equipment do you currently use, if any?", options: ["Shower chair or bench", "Grab bars", "Handheld showerhead", "Non-slip mat", "Transfer bench", "None", "Other"], conditional: bathes },
  { id: "f12", type: "select", prompt: "Has slipping, a fall, or a near-fall happened in your bathroom in the past year?", options: ["Yes", "No", "Prefer not to answer"], safetyFlag: (v) => v === "Yes" },
  { id: "f13", type: "select", prompt: "Can you reach the sink, mirror, and storage you use daily without help?", options: ["Yes", "Some of it", "No"] },
  { id: "f14", type: "select", prompt: "Is there enough space for someone to assist you in the bathroom, if needed?", options: ["Yes", "It's tight but workable", "No", "Not applicable"] },
  { id: "f15", type: "select", prompt: "Does a caregiver or assistant need to be present during bathing?", options: ["Yes, regularly", "Sometimes", "No", "Prefer not to answer"] },
  { id: "f16", type: "textarea", prompt: "What's the hardest part of using your bathroom right now?", optional: true },
  { id: "f17", type: "textarea", prompt: "Anything else about your bathroom that's important to document?", optional: true },
];

const hardToReachStorage = (a) => a.g6 && a.g6 !== "Yes";

const SECTION_G_QUESTIONS = [
  { id: "g1", type: "select", prompt: "Can you move through your kitchen and reach the areas you need on your own?", options: ["Yes", "Mostly", "Only some areas", "No"] },
  { id: "g2", type: "measurement", prompt: "What's the width of the main pathway through your kitchen?" },
  { id: "g3", type: "measurement", prompt: "What's the height of the countertop where you prepare food most often?" },
  { id: "g4", type: "select", prompt: "Can you work at your counter seated, standing, or both?", options: ["Seated only", "Standing only", "Both, depending on the task", "Neither comfortably"] },
  { id: "g5", type: "select", prompt: "Is there open space under any counter or sink for a seated approach?", options: ["Yes", "No", "Partial", "Not sure"] },
  { id: "g6", type: "select", prompt: "Can you reach the items you use most often — dishes, food, cookware — without help?", options: ["Yes", "Some of them", "No"] },
  { id: "g7", type: "multiselect", prompt: "Which storage is hardest to reach?", options: ["Upper cabinets", "Lower cabinets", "Pantry", "Refrigerator or freezer", "Nothing is hard to reach"], conditional: hardToReachStorage },
  { id: "g8", type: "select", prompt: "Can you use your stove or cooktop controls safely and reach the burners?", options: ["Yes", "With difficulty", "No", "I don't use the stove"] },
  { id: "g9", type: "select", prompt: "Can you open your oven and safely remove items from it?", options: ["Yes", "With difficulty", "No", "I don't use the oven"] },
  { id: "g10", type: "select", prompt: "Can you open your refrigerator and reach the shelves you use?", options: ["Yes", "With difficulty", "No"] },
  { id: "g11", type: "select", prompt: "Can you use your sink — reach the faucet and wash dishes — comfortably?", options: ["Yes", "With difficulty", "No"] },
  { id: "g12", type: "multiselect", prompt: "Which kitchen tasks are hardest for you right now?", options: ["Cooking at the stove", "Reaching storage", "Carrying items", "Washing dishes", "Opening the fridge or oven", "Cleaning counters or floors", "None of these"] },
  { id: "g13", type: "select", prompt: "Have you had a burn, cut, drop, or near-miss while cooking in the past year?", options: ["Yes", "No", "Prefer not to answer"], safetyFlag: (v) => v === "Yes" },
  { id: "g14", type: "multiselect", prompt: "Do you use any adaptive kitchen equipment or tools?", options: ["Reacher or grabber", "Jar opener", "Rolling cart", "Adaptive cutting board", "Pull-down shelving", "None", "Other"] },
  { id: "g15", type: "select", prompt: "Is there enough space for someone to help you in the kitchen, if needed?", options: ["Yes", "It's tight but workable", "No", "Not applicable"] },
  { id: "g16", type: "textarea", prompt: "What's the hardest part of cooking or using your kitchen right now?", optional: true },
  { id: "g17", type: "textarea", prompt: "Anything else about your kitchen that's worth documenting?", optional: true },
];

const bedsideSpace = (a) => a.h4 && a.h4 !== "No";
const storesEquipInBedroom = (a) => a.h10 === "Yes";

const SECTION_H_QUESTIONS = [
  { id: "h1", type: "select", prompt: "Can you get into and around your bedroom on your own?", options: ["Yes", "Mostly", "Only with help", "No"] },
  { id: "h2", type: "measurement", prompt: "What's the width of your bedroom doorway?" },
  { id: "h3", type: "measurement", prompt: "What's the height of your bed, from the floor to the top of the mattress?" },
  { id: "h4", type: "select", prompt: "Is there clear space on the side of the bed you need to approach or transfer from?", options: ["Yes, both sides", "Yes, one side only", "No", "Not sure"] },
  { id: "h5", type: "measurement", prompt: "How much clear floor space is there beside the bed?", conditional: bedsideSpace },
  { id: "h6", type: "select", prompt: "How do you get into and out of bed?", options: ["Independently", "With equipment, like a rail or pole", "With help from another person", "Varies"] },
  { id: "h7", type: "multiselect", prompt: "What bed-related equipment do you use, if any?", options: ["Bed rail", "Transfer pole", "Hospital bed", "Bed wedge or positioning pillows", "None", "Other"] },
  { id: "h8", type: "select", prompt: "Can you reach your closet and dressers to get dressed on your own?", options: ["Yes", "Some of it", "No"] },
  { id: "h9", type: "select", prompt: "Can you reach the clothing and items you use most often, without help?", options: ["Yes", "No"] },
  { id: "h10", type: "select", prompt: "Do you have medical or mobility equipment that needs to be stored or charged in your bedroom?", options: ["Yes", "No"] },
  { id: "h11", type: "multiselect", prompt: "What equipment needs power or storage space in your bedroom?", options: ["Wheelchair or scooter charger", "Oxygen equipment", "CPAP or BiPAP machine", "Communication device", "Other"], conditional: storesEquipInBedroom },
  { id: "h12", type: "select", prompt: "Can you reach a light switch or lamp from your bed at night?", options: ["Yes", "No", "Only with difficulty"] },
  { id: "h13", type: "select", prompt: "If you needed help during the night, do you have a way to call for it?", options: ["Yes", "Somewhat", "No"], safetyFlag: (v) => v === "No" },
  { id: "h14", type: "select", prompt: "If there were a fire or emergency at night, could you get out of your bedroom independently?", options: ["Yes", "No", "Not sure"], safetyFlag: (v) => v === "No" },
  { id: "h15", type: "select", prompt: "Is there a clear path from your bed to the door, free of obstacles, in the dark?", options: ["Yes", "No", "Somewhat"] },
  { id: "h16", type: "textarea", prompt: "What's the hardest part of using your bedroom right now?", optional: true },
  { id: "h17", type: "textarea", prompt: "Anything else about your bedroom that's worth documenting?", optional: true },
];

const multiLevel = (a) => a.i1 === "Yes";
const hasLift = (a) => multiLevel(a) && a.i7 === "Yes";
const roomsOutOfReach = (a) => multiLevel(a) && a.i10 === "Yes";

const SECTION_I_QUESTIONS = [
  { id: "i1", type: "select", prompt: "Does your home have more than one level you need to access?", options: ["Yes", "No, my home is a single level", "Not sure"] },
  { id: "i2", type: "select", prompt: "How do you currently get between floors?", options: ["Stairs", "Elevator", "Stair lift", "Platform lift", "I don't go to the other floor(s)", "Varies"], conditional: multiLevel },
  { id: "i3", type: "select", prompt: "Can you use the stairs independently, if there are stairs?", options: ["Yes", "With difficulty", "With help", "No", "There are no stairs"], conditional: multiLevel },
  { id: "i4", type: "measurement", prompt: "How many steps are there between floors?", conditional: multiLevel },
  { id: "i5", type: "measurement", prompt: "What's the width of the stairway?", conditional: multiLevel },
  { id: "i6", type: "select", prompt: "Is there a secure handrail on the stairs?", options: ["Yes, on both sides", "Yes, on one side", "No", "Not sure"], conditional: multiLevel },
  { id: "i7", type: "select", prompt: "Do you have a stair lift or platform lift installed?", options: ["Yes", "No, but interested", "No, and not needed", "Not applicable"], conditional: multiLevel },
  { id: "i8", type: "measurement", prompt: "What's the weight capacity of your stair lift or platform lift, if known?", conditional: hasLift, optional: true },
  { id: "i9", type: "select", prompt: "Does your lift work during a power outage?", options: ["Yes, it has battery backup", "No", "Not sure"], conditional: hasLift },
  { id: "i10", type: "select", prompt: "Is there a room or space you can't reach because it's on a different floor?", options: ["Yes", "No"], conditional: multiLevel },
  { id: "i11", type: "multiselect", prompt: "Which rooms or spaces are out of reach?", options: ["Bedroom", "Bathroom", "Kitchen", "Laundry", "Living space", "Other"], conditional: roomsOutOfReach },
  { id: "i12", type: "select", prompt: "If your elevator or lift stopped working, would you have a safe way to get between floors?", options: ["Yes", "No", "Not sure"], conditional: multiLevel, safetyFlag: (v) => v === "No" },
  { id: "i13", type: "select", prompt: "In a fire or emergency, could you evacuate from every floor you use without relying on an elevator or lift?", options: ["Yes", "No", "Not sure"], conditional: multiLevel, safetyFlag: (v) => v === "No" },
  { id: "i14", type: "textarea", prompt: "Anything else about moving between floors that's worth documenting?", optional: true },
];

const hasInHomeLaundry = (a) => a.j1 !== "I don't have in-home laundry";

const SECTION_J_QUESTIONS = [
  { id: "j1", type: "select", prompt: "Can you access your laundry area on your own?", options: ["Yes", "With difficulty", "No", "I don't have in-home laundry"] },
  { id: "j2", type: "measurement", prompt: "What's the height of your washer and dryer's controls or loading door?", conditional: hasInHomeLaundry },
  { id: "j3", type: "select", prompt: "Can you load and unload your washer and dryer without help?", options: ["Yes", "With difficulty", "No"], conditional: hasInHomeLaundry },
  { id: "j4", type: "select", prompt: "Is your washer and dryer front-loading, top-loading, or stacked?", options: ["Front-loading", "Top-loading", "Stacked", "Combo unit", "Not sure"], conditional: hasInHomeLaundry },
  { id: "j5", type: "select", prompt: "Can you carry laundry to and from the laundry area?", options: ["Yes", "Yes, with a cart or aid", "No, someone else does this", "Varies"], conditional: hasInHomeLaundry },
  { id: "j6", type: "select", prompt: "Can you reach cleaning supplies and household tools you use regularly?", options: ["Yes", "Some of them", "No"] },
  { id: "j7", type: "multiselect", prompt: "Which household tasks are hardest for you right now?", options: ["Laundry", "Vacuuming or sweeping", "Taking out trash", "Dusting or wiping surfaces", "Carrying groceries or supplies", "Changing sheets or bedding", "None of these"] },
  { id: "j8", type: "select", prompt: "Do you have help with household tasks?", options: ["Yes, regularly", "Sometimes", "No", "Prefer not to answer"] },
  { id: "j9", type: "select", prompt: "Can you take out your trash and recycling on your own?", options: ["Yes", "With difficulty", "No"] },
  { id: "j10", type: "measurement", prompt: "How far is it from your door to where trash and recycling bins are kept?", optional: true },
  { id: "j11", type: "select", prompt: "Have you strained, fallen, or been injured doing household tasks in the past year?", options: ["Yes", "No", "Prefer not to answer"], safetyFlag: (v) => v === "Yes" },
  { id: "j12", type: "textarea", prompt: "What's the hardest household task in your home right now?", optional: true },
  { id: "j13", type: "textarea", prompt: "Anything else about laundry or household tasks worth documenting?", optional: true },
];

const usesDiningTable = (a) => a.k5 && a.k5 !== "I don't use the dining table";
const hasWorkspace = (a) => a.k7 && a.k7 !== "No";

const SECTION_K_QUESTIONS = [
  { id: "k1", type: "select", prompt: "Can you access and move around your living room comfortably?", options: ["Yes", "With difficulty", "No"] },
  { id: "k2", type: "measurement", prompt: "How much clear floor space is there for you to move and turn in your main living space?" },
  { id: "k3", type: "select", prompt: "Can you get in and out of your usual seating — sofa or chair — on your own?", options: ["Yes", "With difficulty", "No", "I use a different seating solution"] },
  { id: "k4", type: "select", prompt: "Is there furniture or clutter that blocks your movement in shared spaces?", options: ["Yes, often", "Sometimes", "No"] },
  { id: "k5", type: "select", prompt: "Can you sit at your dining table with your device, or in your usual way?", options: ["Yes", "With difficulty", "No", "I don't use the dining table"] },
  { id: "k6", type: "measurement", prompt: "What's the height of your dining table?", conditional: usesDiningTable },
  { id: "k7", type: "select", prompt: "Do you have a home office or workspace you use?", options: ["Yes", "No", "Sometimes"] },
  { id: "k8", type: "measurement", prompt: "What's the height of your desk or workspace?", conditional: hasWorkspace },
  { id: "k9", type: "select", prompt: "Can you reach your desk, computer, and work materials without help?", options: ["Yes", "With difficulty", "No"], conditional: hasWorkspace },
  { id: "k10", type: "select", prompt: "Can you participate in shared activities — watching TV, hosting guests, and so on — comfortably in your living spaces?", options: ["Yes", "Somewhat", "No"] },
  { id: "k11", type: "select", prompt: "Is there enough space for a caregiver or family member to be present with you in your main living space?", options: ["Yes", "It's tight but workable", "No", "Not applicable"] },
  { id: "k12", type: "multiselect", prompt: "Which shared-space tasks are hardest for you right now?", options: ["Getting in or out of seating", "Reaching light switches or outlets", "Moving around furniture", "Working at a desk", "Sitting at the table", "None of these"] },
  { id: "k13", type: "textarea", prompt: "What's the hardest part about using your living, dining, or work spaces right now?", optional: true },
  { id: "k14", type: "textarea", prompt: "Anything else about these shared spaces worth documenting?", optional: true },
];

const hasOutdoorSpace = (a) => a.l1 && a.l1 !== "No";
const outdoorHasSteps = (a) => a.l5 === "Yes";
const gardens = (a) => a.l9 === "Yes" || a.l9 === "Would like to but currently can't";

const SECTION_L_QUESTIONS = [
  { id: "l1", type: "select", prompt: "Do you have outdoor space attached to your home — a yard, patio, deck, or balcony?", options: ["Yes", "No", "Shared or common outdoor space only"] },
  { id: "l2", type: "select", prompt: "Can you access that outdoor space on your own?", options: ["Yes", "With difficulty", "No"], conditional: hasOutdoorSpace },
  { id: "l3", type: "select", prompt: "What's the surface like on your main outdoor path?", options: ["Paved or concrete", "Gravel", "Grass or dirt", "Wood decking", "Mixed", "Not sure"], conditional: hasOutdoorSpace },
  { id: "l4", type: "measurement", prompt: "What's the width of your main outdoor pathway?", conditional: hasOutdoorSpace },
  { id: "l5", type: "select", prompt: "Are there steps or a level change getting to your outdoor space?", options: ["Yes", "No", "Not sure"], conditional: hasOutdoorSpace },
  { id: "l6", type: "measurement", prompt: "What's the height of that step or level change?", conditional: outdoorHasSteps },
  { id: "l7", type: "select", prompt: "Can you reach your mailbox on your own?", options: ["Yes", "With difficulty", "No", "I don't have my own mailbox"] },
  { id: "l8", type: "select", prompt: "Can you access parking near your home — your own or a visitor's — without crossing an inaccessible path?", options: ["Yes", "With difficulty", "No", "Not applicable"] },
  { id: "l9", type: "select", prompt: "Do you garden or use outdoor space for hobbies or tasks?", options: ["Yes", "No", "Would like to but currently can't"] },
  { id: "l10", type: "select", prompt: "Are garden beds, tools, or outdoor storage at a height and reach that works for you?", options: ["Yes", "No", "Some of it", "Not applicable"], conditional: gardens },
  { id: "l11", type: "select", prompt: "Can you get to and from a vehicle at your home without help?", options: ["Yes", "With difficulty", "No", "Varies"] },
  { id: "l12", type: "select", prompt: "Can you access community spaces near your home — sidewalks, a shared entrance, mail area, amenities?", options: ["Yes", "With difficulty", "No", "Not applicable"] },
  { id: "l13", type: "select", prompt: "Has uneven ground, steps, or an outdoor surface caused a fall or near-fall?", options: ["Yes", "No", "Prefer not to answer"], safetyFlag: (v) => v === "Yes" },
  { id: "l14", type: "textarea", prompt: "What's the hardest part about your outdoor space or getting around your neighborhood right now?", optional: true },
  { id: "l15", type: "textarea", prompt: "Anything else about outdoor areas worth documenting?", optional: true },
];

const usesSmartHome = (a) => a.m5 === "Yes" || a.m5 === "Some";
const needsChargingNearby = (a) => a.m11 === "Yes";

const SECTION_M_QUESTIONS = [
  { id: "m1", type: "select", prompt: "Can you reach the light switches you use most often?", options: ["Yes", "Some of them", "No"] },
  { id: "m2", type: "select", prompt: "Can you reach electrical outlets you use regularly?", options: ["Yes", "Some of them", "No"] },
  { id: "m3", type: "select", prompt: "Can you operate your thermostat on your own?", options: ["Yes", "With difficulty", "No", "Not applicable"] },
  { id: "m4", type: "select", prompt: "Can you lock and unlock your doors on your own?", options: ["Yes", "With difficulty", "No"] },
  { id: "m5", type: "select", prompt: "Do you use any smart-home devices — voice assistants, smart plugs, app-controlled locks or lights?", options: ["Yes", "No", "Some"] },
  { id: "m6", type: "multiselect", prompt: "Which smart-home devices do you currently use?", options: ["Voice assistant", "Smart lights", "Smart locks", "Smart thermostat", "Smart plugs or outlets", "Video doorbell", "Other"], conditional: usesSmartHome },
  { id: "m7", type: "select", prompt: "Can you answer your phone and use it independently?", options: ["Yes", "With difficulty", "No"] },
  { id: "m8", type: "select", prompt: "Do you have a medical alert or emergency call device?", options: ["Yes", "No, but interested", "No, and not needed"] },
  { id: "m9", type: "select", prompt: "Can you hear your doorbell, phone, or smoke alarm clearly?", options: ["Yes, all of them", "Some of them", "No"] },
  { id: "m10", type: "select", prompt: "If you needed to call for emergency help right now, could you do that independently?", options: ["Yes", "No", "Not sure"], safetyFlag: (v) => v === "No" },
  { id: "m11", type: "select", prompt: "Do you need equipment charged regularly — device batteries, medical equipment, a phone — near where you spend most of your time?", options: ["Yes", "No"] },
  { id: "m12", type: "select", prompt: "Is a working outlet within easy reach of where that equipment needs to be?", options: ["Yes", "No", "Sometimes"], conditional: needsChargingNearby },
  { id: "m13", type: "textarea", prompt: "What's the hardest part about using controls, technology, or communication devices in your home right now?", optional: true },
  { id: "m14", type: "textarea", prompt: "Anything else about home controls or technology worth documenting?", optional: true },
];

const hasCaregiver = (a) => a.n1 && a.n1 !== "No";
const hasTherapy = (a) => a.n6 && a.n6 !== "No";
const hasMedEquip = (a) => a.n8 === "Yes";
const hasTelehealth = (a) => a.n10 && a.n10 !== "No, not currently";

const SECTION_N_QUESTIONS = [
  { id: "n1", type: "select", prompt: "Do you currently have a caregiver, personal assistant, or in-home helper?", options: ["Yes, regularly", "Yes, occasionally", "No", "Not currently, but planning to"] },
  { id: "n2", type: "select", prompt: "Is your caregiver a family member, a hired professional, or both?", options: ["Family member", "Hired professional or agency", "Both", "Varies"], conditional: hasCaregiver },
  { id: "n3", type: "select", prompt: "Does your caregiver need to move through your home to assist you, not just visit?", options: ["Yes, throughout the home", "Yes, in specific rooms only", "No, they don't need to move around much"], conditional: hasCaregiver },
  { id: "n4", type: "multiselect", prompt: "Which rooms does your caregiver need full access to?", options: ["Bedroom", "Bathroom", "Kitchen", "Living areas", "All rooms", "Other"], conditional: hasCaregiver },
  { id: "n5", type: "select", prompt: "Is there enough space for your caregiver to safely assist you with physical tasks — transfers, dressing, bathing?", options: ["Yes", "It's tight but workable", "No", "Not applicable"], conditional: hasCaregiver },
  { id: "n6", type: "select", prompt: "Do you receive therapy or medical services at home — PT, OT, nursing, and so on?", options: ["Yes, regularly", "Yes, occasionally", "No"] },
  { id: "n7", type: "select", prompt: "Does that provider need space to bring equipment or work with you?", options: ["Yes", "No", "Not sure"], conditional: hasTherapy },
  { id: "n8", type: "select", prompt: "Do you use any medical equipment that needs regular space or setup at home — dialysis, an oxygen concentrator, a feeding pump, and so on?", options: ["Yes", "No"] },
  { id: "n9", type: "multiselect", prompt: "What kind of medical equipment needs space in your home?", options: ["Oxygen concentrator", "Dialysis equipment", "Feeding pump", "Ventilator or breathing equipment", "Wound care supplies", "Other"], conditional: hasMedEquip },
  { id: "n10", type: "select", prompt: "Do you have telehealth appointments from home?", options: ["Yes, regularly", "Sometimes", "No, not currently"] },
  { id: "n11", type: "select", prompt: "Do you have a private, quiet space with a reliable connection for telehealth visits?", options: ["Yes", "No", "Sometimes"], conditional: hasTelehealth },
  { id: "n12", type: "select", prompt: "If your caregiver couldn't come for a day, would you be able to manage your essential needs safely?", options: ["Yes", "With difficulty", "No"], safetyFlag: (v) => v === "No" },
  { id: "n13", type: "textarea", prompt: "What's the hardest part about caregiving, therapy, or medical equipment access in your home right now?", optional: true },
  { id: "n14", type: "textarea", prompt: "Anything else about caregiver or medical access worth documenting?", optional: true },
];

const usesPoweredEquip = (a) => a.o2 === "Yes";
const cantEvacuateAlone = (a) => a.o8 && a.o8 !== "Yes";
const hasSevereWeather = (a) => a.o10 === "Yes";

const SECTION_O_QUESTIONS = [
  { id: "o1", type: "select", prompt: "Does your home have more than one floor you'd need to evacuate from?", options: ["Yes", "No", "Not sure"] },
  { id: "o2", type: "select", prompt: "Do you rely on any powered medical or mobility equipment daily?", options: ["Yes", "No"] },
  { id: "o3", type: "select", prompt: "Do you have a backup power plan for that equipment — battery, generator, or similar?", options: ["Yes", "No", "Not sure"], conditional: usesPoweredEquip },
  { id: "o4", type: "measurement", prompt: "How long can your equipment run on battery backup, if you know?", optional: true, conditional: usesPoweredEquip },
  { id: "o5", type: "select", prompt: "Do you have working smoke detectors in the areas you spend the most time?", options: ["Yes", "Some", "No", "Not sure"] },
  { id: "o6", type: "select", prompt: "Can you hear or otherwise be alerted by your smoke detector if it goes off?", options: ["Yes", "No", "Not sure"] },
  { id: "o7", type: "select", prompt: "Do you have a carbon monoxide detector?", options: ["Yes", "No", "Not sure"] },
  { id: "o8", type: "select", prompt: "If there were a fire, could you evacuate your home independently?", options: ["Yes", "No", "With help only"], safetyFlag: (v) => v && v !== "Yes" },
  { id: "o9", type: "select", prompt: "Do you have a plan for how someone would help you evacuate?", options: ["Yes", "No", "Not really"], conditional: cantEvacuateAlone },
  { id: "o10", type: "select", prompt: "Does your region experience severe weather that could affect your home — hurricanes, tornadoes, wildfires, flooding, winter storms?", options: ["Yes", "No", "Not sure"] },
  { id: "o11", type: "select", prompt: "Do you have an accessible plan for severe weather — shelter location, supplies, transportation?", options: ["Yes", "No", "Partially"], conditional: hasSevereWeather },
  { id: "o12", type: "select", prompt: "If the power went out for 24 hours or more, would your essential needs still be met — medication refrigeration, equipment, communication?", options: ["Yes", "With difficulty", "No"] },
  { id: "o13", type: "select", prompt: "Do you have at least a few days of supplies — medication, food, water — set aside for an emergency?", options: ["Yes", "Some", "No"] },
  { id: "o14", type: "select", prompt: "Do you have a way to reach emergency responders that doesn't depend on being able to speak clearly or move quickly?", options: ["Yes", "No", "Not sure"] },
  { id: "o15", type: "textarea", prompt: "What's your biggest concern about handling an emergency in your home right now?", optional: true },
  { id: "o16", type: "textarea", prompt: "Anything else about emergency planning worth documenting?", optional: true },
];

const renting = (a) => a.p2 === "Rent";
const hasInsuranceMaybe = (a) => a.p5 === "Yes" || a.p5 === "Not sure";
const hasEstimates = (a) => a.p10 && a.p10 !== "No, not yet";

const SECTION_P_QUESTIONS = [
  { id: "p1", type: "select", prompt: "Where are you in this project right now?", options: ["Just exploring", "Ready to plan but haven't started", "Getting estimates", "Ready to move forward", "Project already underway"] },
  { id: "p2", type: "select", prompt: "Do you rent or own this home?", options: ["Own", "Rent", "Other arrangement"] },
  { id: "p3", type: "select", prompt: "Do you have permission from your landlord or property owner to make modifications?", options: ["Yes", "No", "Haven't asked yet", "Not sure if needed"], conditional: renting },
  { id: "p4", type: "select", prompt: "What's your rough budget range for this project, if you have one in mind?", options: ["Under $1,000", "$1,000–$5,000", "$5,000–$20,000", "$20,000–$50,000", "Over $50,000", "No budget in mind yet", "Prefer not to answer"] },
  { id: "p5", type: "select", prompt: "Do you have insurance that might help cover any of this — health, home, or auto?", options: ["Yes", "No", "Not sure"] },
  { id: "p6", type: "select", prompt: "Have you contacted your insurance provider about accessibility modifications?", options: ["Yes", "No", "Not yet"], conditional: hasInsuranceMaybe },
  { id: "p7", type: "select", prompt: "Do you use Medicaid or another public support program that might help with home modifications?", options: ["Yes", "No", "Not sure", "Prefer not to answer"] },
  { id: "p8", type: "select", prompt: "Are you exploring or applying for any grants for accessibility modifications?", options: ["Yes, applying", "Yes, exploring options", "No", "Not sure where to start"] },
  { id: "p9", type: "select", prompt: "Will you need financing — a loan or payment plan — for this project?", options: ["Yes", "No", "Not sure yet"] },
  { id: "p10", type: "select", prompt: "Do you already have any estimates from contractors?", options: ["Yes, one", "Yes, more than one", "No, not yet"] },
  { id: "p11", type: "select", prompt: "Do those estimates cover the same scope of work, so they're easy to compare?", options: ["Yes", "No, they're for different things", "Not sure"], conditional: hasEstimates },
  { id: "p12", type: "select", prompt: "Have you verified any contractor's license, insurance, or accessibility experience?", options: ["Yes", "No, not yet", "Not applicable — haven't chosen a contractor"] },
  { id: "p13", type: "select", prompt: "Will you need to remain living in your home during construction?", options: ["Yes", "No", "Not sure yet"] },
  { id: "p14", type: "select", prompt: "Has a contractor asked for a deposit or payment before work has started or been approved?", options: ["Yes", "No", "Not applicable"] },
  { id: "p15", type: "select", prompt: "Do you feel any pressure to sign or commit before you're ready?", options: ["Yes", "No", "A little"], safetyFlag: (v) => v === "Yes" },
  { id: "p16", type: "select", prompt: "Do you have documentation ready — measurements, photos, medical needs — that a contractor would need?", options: ["Yes, most of it", "Some of it", "Not yet"] },
  { id: "p17", type: "multiselect", prompt: "Which of these still feel unclear or unresolved for this project?", options: ["Budget", "Funding source", "Contractor selection", "Permits or approvals", "Property permission", "Scope of work", "Timeline", "Nothing feels unresolved"] },
  { id: "p18", type: "select", prompt: "If you had to pick one thing to address first, which category feels most urgent?", options: ["Immediate safety", "Essential access — like a bathroom or entrance", "Independence improvements", "Future planning", "Not sure yet"] },
  { id: "p19", type: "textarea", prompt: "What's the biggest thing standing in the way of moving this project forward?", optional: true },
  { id: "p20", type: "textarea", prompt: "Anything else about budget, funding, or contractor readiness worth documenting?", optional: true },
];

const SECTIONS = SECTION_META.map((m) => {
  if (m.id === "A") return { ...m, builtOut: true, questions: SECTION_A_QUESTIONS };
  if (m.id === "B") return { ...m, builtOut: true, questions: SECTION_B_QUESTIONS };
  if (m.id === "C") return { ...m, builtOut: true, questions: SECTION_C_QUESTIONS };
  if (m.id === "D") return { ...m, builtOut: true, questions: SECTION_D_QUESTIONS };
  if (m.id === "E") return { ...m, builtOut: true, questions: SECTION_E_QUESTIONS };
  if (m.id === "F") return { ...m, builtOut: true, questions: SECTION_F_QUESTIONS };
  if (m.id === "G") return { ...m, builtOut: true, questions: SECTION_G_QUESTIONS };
  if (m.id === "H") return { ...m, builtOut: true, questions: SECTION_H_QUESTIONS };
  if (m.id === "I") return { ...m, builtOut: true, questions: SECTION_I_QUESTIONS };
  if (m.id === "J") return { ...m, builtOut: true, questions: SECTION_J_QUESTIONS };
  if (m.id === "K") return { ...m, builtOut: true, questions: SECTION_K_QUESTIONS };
  if (m.id === "L") return { ...m, builtOut: true, questions: SECTION_L_QUESTIONS };
  if (m.id === "M") return { ...m, builtOut: true, questions: SECTION_M_QUESTIONS };
  if (m.id === "N") return { ...m, builtOut: true, questions: SECTION_N_QUESTIONS };
  if (m.id === "O") return { ...m, builtOut: true, questions: SECTION_O_QUESTIONS };
  if (m.id === "P") return { ...m, builtOut: true, questions: SECTION_P_QUESTIONS };
  return { ...m, builtOut: false, questions: [] };
});

const STATUS_LABEL = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  not_applicable: "Not applicable",
};

/* ---------------------------------------------------------------
   Pricing tiers
   NOTE: no real payment processing happens here — there's no backend
   to charge a card. This simulates plan selection and the resulting
   unlock/lock behavior, so the structure is ready the moment real
   billing (App Store, Play Store, or Stripe) gets wired in.
----------------------------------------------------------------*/
const PRICING_TIERS = [
  {
    id: "free",
    name: "Get Started",
    price: "Free",
    cadence: "",
    tagline: "Try the assessment with your first three sections.",
    features: ["Sections A–C", "Save and resume anytime", "Safety flag summary"],
    sectionsIncluded: ["A", "B", "C"],
  },
  {
    id: "complete",
    name: "Full Assessment",
    price: "$19",
    cadence: "one-time",
    tagline: "All 16 sections and your complete Home Accessibility Profile.",
    features: ["All 16 sections, A–P", "Full Home Accessibility Profile", "Safety flagging throughout", "Unlimited edits and resets"],
    sectionsIncluded: "all",
  },
  {
    id: "contractor",
    name: "Contractor Ready",
    price: "$39",
    cadence: "one-time",
    tagline: "Everything in Full Assessment, plus contractor-ready deliverables.",
    features: ["Everything in Full Assessment", "Accessibility Priority Plan — coming soon", "Contractor Preparation Package — coming soon", "Funding & Documentation Checklist — coming soon"],
    sectionsIncluded: "all",
  },
];

function isSectionLocked(sectionId, planId) {
  const tier = PRICING_TIERS.find((t) => t.id === planId) || PRICING_TIERS[1];
  if (tier.sectionsIncluded === "all") return false;
  return !tier.sectionsIncluded.includes(sectionId);
}

/* ---------------------------------------------------------------
   Storage helpers
----------------------------------------------------------------*/
const keyFor = (id) => `accesspath:section:${id}`;

async function loadSection(id) {
  try {
    const res = await window.storage.get(keyFor(id));
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    /* not stored yet */
  }
  return { status: "not_started", answers: {}, lastIndex: 0 };
}

async function saveSection(id, data) {
  try {
    await window.storage.set(keyFor(id), JSON.stringify(data));
  } catch (e) {
    console.error("AccessPath: failed to save", id, e);
  }
}

/* ---------------------------------------------------------------
   Small building blocks
----------------------------------------------------------------*/
function LetterTag({ id, status, size = "md" }) {
  const dims = size === "lg" ? { w: 52, h: 52, fs: 20 } : size === "sm" ? { w: 26, h: 26, fs: 11 } : { w: 36, h: 36, fs: 14 };
  const filled = status === "completed";
  const partial = status === "in_progress";
  const na = status === "not_applicable";
  const bg = filled ? C.accent : partial ? C.goldSoft : na ? C.bgAlt : "transparent";
  const border = filled ? C.accent : partial ? C.gold : na ? C.inkFaint : C.line;
  const fg = filled ? "#fff" : partial ? C.gold : na ? C.inkFaint : C.inkSoft;
  return (
    <div
      style={{
        width: dims.w, height: dims.h, background: bg, border: `1.5px solid ${border}`,
        color: fg, fontFamily: "'JetBrains Mono', monospace", fontSize: dims.fs,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 6, flexShrink: 0, fontWeight: 500,
      }}
    >
      {id}
    </div>
  );
}

function ProgressBar({ pct, color = C.accent, track = C.bgAlt, height = 6 }) {
  return (
    <div style={{ background: track, height, borderRadius: 999, overflow: "hidden", width: "100%" }}>
      <div style={{ background: color, height: "100%", width: `${pct}%`, transition: "width 300ms ease" }} />
    </div>
  );
}
function QuestionDots({ total, currentIndex, visible, answers, onJump }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const q = visible[i];
        const v = q ? answers[q.id] : undefined;
        const answered = v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
        const reachable = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <button
            key={i}
            onClick={() => reachable && onJump(i)}
            disabled={!reachable}
            title={`Jump to question ${i + 1}`}
            style={{
              width: isCurrent ? 12 : 9,
              height: isCurrent ? 12 : 9,
              borderRadius: 999,
              border: `1.5px solid ${isCurrent || answered ? C.accent : C.line}`,
              background: isCurrent ? C.accent : answered ? C.accentSoft : "transparent",
              cursor: reachable ? "pointer" : "default",
              padding: 0,
              flexShrink: 0,
              opacity: reachable ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
function sectionPercent(section, data) {
  if (!data) return 0;
  if (data.status === "completed" || data.status === "not_applicable") return 100;
  if (section.builtOut) {
    const total = section.questions.length;
    const answered = Object.keys(data.answers || {}).filter((k) => {
      const v = data.answers[k];
      return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
    }).length;
    return total ? Math.round((answered / total) * 100) : 0;
  }
  return data.status === "in_progress" ? 10 : 0;
}

function visibleQuestions(questions, answers) {
  return questions.filter((q) => !q.conditional || q.conditional(answers));
}

function formatAnswer(q, v) {
  if (v === undefined || v === null || v === "") return "—";
  if (q.type === "multiselect") return Array.isArray(v) && v.length ? v.join(", ") : "—";
  if (q.type === "measurement") {
    if (v.special) return v.special;
    if (v.value === "" || v.value === undefined) return "—";
    return `${v.value} ${v.unit}`;
  }
  return String(v);
}

function collectSafetyItems(allData) {
  const items = [];
  SECTIONS.forEach((s) => {
    if (!s.builtOut) return;
    const d = allData[s.id];
    if (!d || !d.answers) return;
    s.questions.forEach((q) => {
      if (!q.safetyFlag) return;
      const ans = d.answers[q.id];
      if (ans !== undefined && ans !== null && q.safetyFlag(ans)) {
        items.push({ sectionId: s.id, prompt: q.prompt, answer: formatAnswer(q, ans) });
      }
    });
  });
  return items;
}

function collectBarrierNotes(allData, sectionIds) {
  return sectionIds
    .map((id) => SECTIONS.find((s) => s.id === id))
    .filter((s) => s && allData[s.id] && Object.keys(allData[s.id].answers || {}).length > 0)
    .map((s) => {
      const d = allData[s.id];
      const notes = s.questions
        .filter((q) => q.type === "textarea" && d.answers[q.id] && d.answers[q.id].trim() !== "")
        .map((q) => d.answers[q.id]);
      return { section: s, notes, status: d.status };
    })
    .filter((entry) => entry.notes.length > 0);
}

function collectMeasurements(allData) {
  const rows = [];
  SECTIONS.forEach((s) => {
    if (!s.builtOut) return;
    const d = allData[s.id];
    if (!d || !d.answers) return;
    s.questions.forEach((q) => {
      if (q.type !== "measurement") return;
      const val = formatAnswer(q, d.answers[q.id]);
      if (val && val !== "—") rows.push({ sectionId: s.id, sectionTitle: s.title, prompt: q.prompt, value: val });
    });
  });
  return rows;
}

/* ---------------------------------------------------------------
   Answer input components
----------------------------------------------------------------*/
function ChoiceInput({ options, value, multi, onChange }) {
  const isSelected = (opt) => (multi ? Array.isArray(value) && value.includes(opt) : value === opt);
  const toggle = (opt) => {
    if (multi) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
    } else {
      onChange(opt);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const sel = isSelected(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            aria-pressed={sel}
            className="text-left transition"
            style={{
              padding: "10px 16px", borderRadius: 8, fontFamily: "'Inter', sans-serif",
              fontSize: 15, border: `1.5px solid ${sel ? C.accent : C.line}`,
              background: sel ? C.accentSoft : C.panel, color: sel ? C.accent : C.ink,
              cursor: "pointer", fontWeight: sel ? 600 : 400,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TextInput({ value, onChange, area }) {
  const Tag = area ? "textarea" : "input";
  return (
    <Tag
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      rows={area ? 4 : undefined}
      placeholder="Type your answer…"
      className="w-full focus:outline-none"
      style={{
        border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "12px 14px",
        fontFamily: "'Inter', sans-serif", fontSize: 15, color: C.ink, background: C.panel,
        resize: area ? "vertical" : "none",
      }}
    />
  );
}

function MeasurementInput({ value, onChange }) {
  const v = value && typeof value === "object" ? value : { value: "", unit: "in", special: null };
  const setNum = (n) => onChange({ value: n, unit: v.unit, special: null });
  const setUnit = (u) => onChange({ value: v.value, unit: u, special: null });
  const setSpecial = (s) => onChange({ value: "", unit: v.unit, special: s });
  const specials = ["Unable to measure safely", "Not sure", "Prefer not to answer"];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={v.special ? "" : v.value}
          onChange={(e) => setNum(e.target.value)}
          disabled={!!v.special}
          placeholder="0"
          className="focus:outline-none"
          style={{
            width: 120, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "10px 12px",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: C.ink,
            background: v.special ? C.bgAlt : C.panel,
          }}
        />
        <div className="flex gap-1">
          {["in", "cm"].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              disabled={!!v.special}
              aria-pressed={v.unit === u && !v.special}
              style={{
                padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                border: `1.5px solid ${v.unit === u && !v.special ? C.accent : C.line}`,
                background: v.unit === u && !v.special ? C.accentSoft : C.panel,
                color: v.unit === u && !v.special ? C.accent : C.inkSoft, cursor: "pointer",
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {specials.map((s) => (
          <button
            key={s}
            onClick={() => setSpecial(v.special === s ? null : s)}
            style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 13, fontFamily: "'Inter', sans-serif",
              border: `1px solid ${v.special === s ? C.gold : C.line}`,
              background: v.special === s ? C.goldSoft : "transparent",
              color: v.special === s ? C.gold : C.inkFaint, cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionInput({ q, value, onChange }) {
  switch (q.type) {
    case "select":
      return <ChoiceInput options={q.options} value={value} onChange={onChange} />;
    case "multiselect":
      return <ChoiceInput options={q.options} value={value} multi onChange={onChange} />;
    case "text":
      return <TextInput value={value} onChange={onChange} />;
    case "textarea":
      return <TextInput value={value} onChange={onChange} area />;
    case "measurement":
      return <MeasurementInput value={value} onChange={onChange} />;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------
   Section flow (intro -> questions -> review)
----------------------------------------------------------------*/
function SectionFlow({ section, data, onExit, onSave }) {
  const [mode, setMode] = useState(data.status === "not_started" ? "intro" : "questions");
  const [answers, setAnswers] = useState(data.answers || {});
  const [index, setIndex] = useState(data.lastIndex || 0);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const visible = visibleQuestions(section.questions, answers);
  const total = visible.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const q = visible[safeIndex];

  const persist = useCallback((partialAnswers, status, lastIndex) => {
    const next = { status, answers: partialAnswers, lastIndex, completedAt: status === "completed" ? new Date().toISOString() : data.completedAt };
    onSave(next);
  }, [onSave, data.completedAt]);

  const setAnswer = (val) => {
    const next = { ...answers, [q.id]: val };
    setAnswers(next);
    persist(next, "in_progress", safeIndex);
  };

  const goNext = () => {
    if (safeIndex >= total - 1) {
      setMode("review");
      persist(answers, "in_progress", safeIndex);
    } else {
      setIndex(safeIndex + 1);
      persist(answers, "in_progress", safeIndex + 1);
    }
  };
  const goBack = () => {
    if (safeIndex === 0) { setMode("intro"); return; }
    setIndex(safeIndex - 1);
    persist(answers, "in_progress", safeIndex - 1);
  };

  const markComplete = () => { persist(answers, "completed", 0); onExit(); };
  const markNotApplicable = () => { persist({}, "not_applicable", 0); onExit(); };
  const saveExit = () => { persist(answers, data.status === "completed" ? "completed" : "in_progress", safeIndex); onExit(); };
  const resetSection = () => {
    setAnswers({});
    setIndex(0);
    persist({}, "not_started", 0);
    setMode("intro");
    setConfirmingReset(false);
  };

  const flaggedCount = section.questions.filter((qq) => qq.safetyFlag && qq.safetyFlag(answers[qq.id])).length;

  if (mode === "intro") {
    return (
      <div className="max-w-xl mx-auto px-6 py-14">
        <div aria-live="polite" className="sr-only">{section.title} section</div>
        <button onClick={onExit} className="flex items-center gap-1 mb-10" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
    
          <ChevronLeft size={16} /> Back to your assessment
        </button>
        <div className="flex items-center gap-4 mb-6">
          <LetterTag id={section.id} status={data.status} size="lg" />
          <section.Icon size={22} color={C.inkSoft} />
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 10 }}>{section.title}</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: C.inkSoft, lineHeight: 1.6, marginBottom: 8 }}>{section.desc}</p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.inkFaint, marginBottom: 36 }}>{section.questions.length} questions · answer only what applies to you</p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setMode("questions")}
            style={{ background: C.accent, color: "#fff", padding: "12px 22px", borderRadius: 8, border: "none", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            {data.status === "not_started" ? "Begin this section" : "Continue this section"}
          </button>
          <button
            onClick={markNotApplicable}
            style={{ background: "none", border: "none", color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}
          >
            This doesn't apply to me
          </button>
        </div>
        {data.status !== "not_started" && (
          <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${C.line}` }}>
            {!confirmingReset ? (
              <button
                onClick={() => setConfirmingReset(true)}
                style={{ background: "none", border: "none", color: C.alert, fontFamily: "'Inter', sans-serif", fontSize: 13.5, cursor: "pointer" }}
              >
                Reset this section and start over
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.alert }}>Erase all answers in this section? This can't be undone.</p>
                <button onClick={resetSection} style={{ background: C.alert, color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 13, fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>Yes, reset</button>
                <button onClick={() => setConfirmingReset(false)} style={{ background: "none", border: "none", color: C.inkFaint, fontSize: 13, fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className="max-w-xl mx-auto px-6 py-14">
        <button onClick={() => setMode("questions")} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
          <ChevronLeft size={16} /> Back to questions
        </button>
        <div className="flex items-center gap-4 mb-3">
          <LetterTag id={section.id} status="in_progress" size="lg" />
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: C.ink, fontWeight: 600 }}>Review your answers</h1>
        </div>
        {flaggedCount > 0 && (
          <div role="alert" aria-live="assertive" className="flex items-start gap-2 mb-6" style={{ background: C.alertSoft, border: `1px solid ${C.alert}22`, borderRadius: 8, padding: "10px 14px" }}>
            <AlertTriangle size={16} color={C.alert} style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.alert }}>
              {flaggedCount} response{flaggedCount > 1 ? "s" : ""} in this section {flaggedCount > 1 ? "have" : "has"} been noted as worth extra attention. This isn't a diagnosis — it just means we'll carry it forward as a priority.
            </p>
          </div>
        )}
        <div className="flex flex-col mb-8" style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
          {visible.map((qq, i) => (
            <div key={qq.id} className="flex items-start justify-between gap-4" style={{ padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.line}`, background: C.panel }}>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.inkFaint, marginBottom: 3 }}>{qq.prompt}</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14.5, color: C.ink }}>{formatAnswer(qq, answers[qq.id])}</p>
              </div>
              <button onClick={() => { setIndex(i); setMode("questions"); }} style={{ background: "none", border: "none", color: C.accent, fontFamily: "'Inter', sans-serif", fontSize: 13, cursor: "pointer", flexShrink: 0 }}>Edit</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={markComplete} style={{ background: C.accent, color: "#fff", padding: "12px 22px", borderRadius: 8, border: "none", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={16} /> Mark section complete
          </button>
          <button onClick={saveExit} style={{ background: "none", border: "none", color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, cursor: "pointer" }}>Save and exit for now</button>
        </div>
      </div>
    );
  }

  // questions mode
  return (
    <div className="max-w-xl mx-auto px-6 py-14">
    <div aria-live="polite" className="sr-only">{section.title} — question {safeIndex + 1} of {total}</div>
      <div className="flex items-center justify-between mb-8">
        <button onClick={goBack} className="flex items-center gap-1" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <button onClick={saveExit} style={{ background: "none", border: "none", color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 13, cursor: "pointer" }}>Save & exit</button>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <LetterTag id={section.id} status="in_progress" />
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.inkFaint }}>Question {safeIndex + 1} of {total}</p>
      </div>
      <div className="mb-8"><QuestionDots total={total} currentIndex={safeIndex} visible={visible} answers={answers} onJump={(i) => { setIndex(i); persist(answers, "in_progress", i); }} /></div>

      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: C.ink, fontWeight: 500, lineHeight: 1.4, marginBottom: q.help ? 8 : 24 }}>{q.prompt}</h2>
      {q.help && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.inkSoft, marginBottom: 24, lineHeight: 1.5 }}>{q.help}</p>}

      <div className="mb-10"><QuestionInput q={q} value={answers[q.id]} onChange={setAnswer} /></div>

      <div className="flex items-center gap-4">
        <button
          onClick={goNext}
          style={{ background: C.accent, color: "#fff", padding: "12px 24px", borderRadius: 8, border: "none", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          {safeIndex >= total - 1 ? "Review answers" : "Continue"} <ChevronRight size={16} />
        </button>
        {q.optional && (
          <button onClick={goNext} style={{ background: "none", border: "none", color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, cursor: "pointer" }}>Skip</button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Not-built section screen
----------------------------------------------------------------*/
function NotBuiltSection({ section, data, onExit, onMarkNA }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-10" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to your assessment
      </button>
      <div className="flex items-center gap-4 mb-6">
        <LetterTag id={section.id} status={data.status} size="lg" />
        <section.Icon size={22} color={C.inkSoft} />
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: C.ink, fontWeight: 600, marginBottom: 10 }}>{section.title}</h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: C.inkSoft, lineHeight: 1.6, marginBottom: 28 }}>{section.desc}</p>
      <div style={{ background: C.bgAlt, borderRadius: 10, padding: "16px 18px", marginBottom: 24 }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.inkSoft, lineHeight: 1.6 }}>
          This section isn't built out yet — Sections A and B are fully working right now. Tell me to build this one next and I'll add its full question flow, same as the others.
        </p>
      </div>
      <button
        onClick={onMarkNA}
        style={{ background: "none", border: `1px solid ${C.line}`, color: C.inkSoft, padding: "10px 18px", borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 14, cursor: "pointer" }}
      >
        {data.status === "not_applicable" ? "✓ Marked as not applicable" : "Mark as not applicable for now"}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------
   Home Accessibility Profile — synthesizes answers across sections
----------------------------------------------------------------*/
function Row({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-start justify-between gap-6 py-2" style={{ borderTop: `1px solid ${C.line}` }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.inkSoft, flexShrink: 0, maxWidth: "55%" }}>{label}</p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, color: C.ink, textAlign: "right" }}>{value}</p>
    </div>
  );
}

function ProfilePanel({ title, subtitle, children }) {
  return (
    <div className="mb-6" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "18px 20px" }}>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: subtitle ? 2 : 4 }}>{title}</p>
      {subtitle && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.inkFaint, marginBottom: 8 }}>{subtitle}</p>}
      <div>{children}</div>
    </div>
  );
}

function ProfileView({ allData, onExit, currentPlan, onOpenPriority, onOpenContractor, onOpenFunding, onOpenPricing }) {
  const anyData = SECTIONS.some((s) => allData[s.id] && Object.keys(allData[s.id].answers || {}).length > 0);

  if (!anyData) {
    return (
      <div className="max-w-xl mx-auto px-6 py-14">
        <button onClick={onExit} className="flex items-center gap-1 mb-10" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
          <ChevronLeft size={16} /> Back to your assessment
        </button>
        <FileText size={22} color={C.inkFaint} className="mb-4" />
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: C.ink, fontWeight: 600, marginBottom: 10 }}>Your profile is empty so far</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: C.inkSoft, lineHeight: 1.6 }}>
          Answer a few questions in any section and this page will start filling in with a readable picture of you and your home.
        </p>
      </div>
    );
  }

  const A = allData.A?.answers || {};
  const B = allData.B?.answers || {};
  const C_ = allData.C?.answers || {};
  const N = allData.N?.answers || {};
  const P = allData.P?.answers || {};

  const safetyItems = collectSafetyItems(allData);
  const barrierIds = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
  const barrierSections = SECTIONS.filter((s) => barrierIds.includes(s.id) && allData[s.id] && Object.keys(allData[s.id].answers || {}).length > 0);

  const completedCount = SECTIONS.filter((s) => allData[s.id]?.status === "completed").length;
  const unlocked = currentPlan === "contractor";

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to your assessment
      </button>
      <div className="flex items-center gap-3 mb-2">
        <FileText size={20} color={C.accent} />
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.accent }}>Home Accessibility Profile</p>
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 8 }}>The picture so far</h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: C.inkSoft, lineHeight: 1.6, marginBottom: 32 }}>
        Built from {completedCount} of 16 completed section{completedCount === 1 ? "" : "s"}. This updates automatically as you answer more — nothing here is final.
      </p>

      {safetyItems.length > 0 && (
        <div className="mb-8" style={{ background: C.alertSoft, border: `1px solid ${C.alert}33`, borderRadius: 10, padding: "18px 20px" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} color={C.alert} />
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: C.alert }}>Worth extra attention</p>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.alert, marginBottom: 12, lineHeight: 1.5 }}>
            These responses were flagged as you went — not as a diagnosis, just as things to carry forward and address early.
          </p>
          <div className="flex flex-col gap-2">
            {safetyItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <LetterTag id={item.sectionId} status="in_progress" size="sm" />
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.4, paddingTop: 4 }}>{item.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProfilePanel title="Who this is for, and why" subtitle="From Section A">
        <Row label="This assessment is for" value={A.a2} />
        <Row label="Motivation for this project" value={A.a12} />
        <Row label="Home ownership" value={A.a13} />
        <Row label="Overall goal" value={A.a14} />
        <Row label="Regular help needed at home" value={A.a5} />
      </ProfilePanel>

      <ProfilePanel title="Mobility and equipment" subtitle="From Sections A and B">
        <Row label="Mobility devices used" value={Array.isArray(A.a3) ? A.a3.join(", ") : A.a3} />
        <Row label="Device stability over time" value={A.a4} />
        <Row label="Device measured in Section B" value={B.b1} />
        <Row label="Overall width" value={B.b2 ? formatAnswer({ type: "measurement" }, B.b2) : null} />
        <Row label="Occupied width" value={B.b3 ? formatAnswer({ type: "measurement" }, B.b3) : null} />
        <Row label="Turning space needed" value={B.b8 ? formatAnswer({ type: "measurement" }, B.b8) : null} />
        <Row label="Attachments affecting clearance" value={Array.isArray(B.b9) ? B.b9.join(", ") : B.b9} />
      </ProfilePanel>

      <ProfilePanel title="Transfers and positioning" subtitle="From Section C">
        <Row label="Transfer method" value={C_.c1} />
        <Row label="Needs help to transfer" value={C_.c4} />
        <Row label="Equipment used" value={Array.isArray(C_.c9) ? C_.c9.join(", ") : C_.c9} />
        <Row label="Where transfers happen" value={Array.isArray(C_.c13) ? C_.c13.join(", ") : C_.c13} />
      </ProfilePanel>

      {barrierSections.length > 0 && (
        <ProfilePanel title="Home barriers, room by room" subtitle="From Sections D through M">
          {barrierSections.map((s) => {
            const d = allData[s.id];
            const notes = s.questions.filter((q) => q.type === "textarea" && d.answers[q.id] && d.answers[q.id].trim() !== "");
            return (
              <div key={s.id} className="py-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <LetterTag id={s.id} status={d.status} size="sm" />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: C.ink }}>{s.title}</p>
                </div>
                {notes.length > 0 ? (
                  notes.map((q) => (
                    <p key={q.id} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.inkSoft, lineHeight: 1.5, marginBottom: 4 }}>
                      “{d.answers[q.id]}”
                    </p>
                  ))
                ) : (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.inkFaint, fontStyle: "italic" }}>No specific notes recorded yet.</p>
                )}
              </div>
            );
          })}
        </ProfilePanel>
      )}

      <ProfilePanel title="Caregiver and medical needs" subtitle="From Section N">
        <Row label="Has a caregiver" value={N.n1} />
        <Row label="Caregiver needs full-home access" value={N.n3} />
        <Row label="Medical equipment needing space" value={Array.isArray(N.n9) ? N.n9.join(", ") : N.n9} />
        <Row label="Receives home-based therapy" value={N.n6} />
      </ProfilePanel>

      <ProfilePanel title="Budget and next steps" subtitle="From Section P">
        <Row label="Project stage" value={P.p1} />
        <Row label="Rough budget range" value={P.p4} />
        <Row label="Most urgent category" value={P.p18} />
        <Row label="Still unresolved" value={Array.isArray(P.p17) ? P.p17.join(", ") : P.p17} />
        <Row label="Biggest obstacle right now" value={P.p19} />
      </ProfilePanel>

      <ProfilePanel title="Your deliverables" subtitle={unlocked ? "Generated from everything above" : "Included with Contractor Ready"}>
        {[
          { label: "Accessibility Priority Plan", desc: "Your barriers sorted into what needs attention first.", onClick: onOpenPriority },
          { label: "Contractor Preparation Package", desc: "Measurements, specs, and questions to bring to a contractor.", onClick: onOpenContractor },
          { label: "Funding & Documentation Checklist", desc: "What's done and what's still missing for financing this project.", onClick: onOpenFunding },
        ].map((item) => (
          <button
            key={item.label}
            onClick={unlocked ? item.onClick : onOpenPricing}
            className="w-full flex items-center justify-between gap-4 text-left"
            style={{ padding: "12px 0", borderTop: `1px solid ${C.line}`, background: "none", border: "none", borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: C.line, cursor: "pointer" }}
          >
            <div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: C.ink }}>{item.label}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.inkFaint }}>{item.desc}</p>
            </div>
            {unlocked ? <ChevronRight size={16} color={C.accent} style={{ flexShrink: 0 }} /> : <Lock size={16} color={C.inkFaint} style={{ flexShrink: 0 }} />}
          </button>
        ))}
      </ProfilePanel>
    </div>
  );
}

/* ---------------------------------------------------------------
   Pricing view
----------------------------------------------------------------*/
function PricingView({ currentPlan, onSelectPlan, onStartCheckout, onExit }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to your assessment
      </button>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 8 }}>Choose your plan</h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 10 }}>
        Every section stays saved no matter what you pick — upgrading just unlocks the rest.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.inkFaint, lineHeight: 1.5, marginBottom: 28, fontStyle: "italic" }}>
        This is a working preview of pricing, not a real checkout — no payment is being processed here yet.
      </p>

      <div className="flex flex-col gap-4">
        {PRICING_TIERS.map((tier) => {
          const active = currentPlan === tier.id;
          return (
            <div
              key={tier.id}
              style={{
                background: C.panel, border: `1.5px solid ${active ? C.accent : C.line}`, borderRadius: 12, padding: "20px 22px",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: C.ink }}>{tier.name}</p>
                <div className="text-right">
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: C.accent }}>{tier.price}</p>
                  {tier.cadence && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: C.inkFaint }}>{tier.cadence}</p>}
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>{tier.tagline}</p>
              <div className="flex flex-col gap-1.5 mb-5">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={14} color={C.accent} style={{ marginTop: 3, flexShrink: 0 }} />
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.ink }}>{f}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => (tier.id === "free" ? onSelectPlan(tier.id) : onStartCheckout(tier.id))}
                disabled={active}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 8, border: active ? `1.5px solid ${C.accent}` : "none",
                  background: active ? "transparent" : C.accent, color: active ? C.accent : "#fff",
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, cursor: active ? "default" : "pointer",
                }}
              >
                {active ? "Current plan" : "Choose this plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Deliverable: Accessibility Priority Plan
----------------------------------------------------------------*/
function PriorityCategory({ title, color, description, safetyStyleItems, noteStyleItems, emptyText }) {
  const hasItems = (safetyStyleItems && safetyStyleItems.length > 0) || (noteStyleItems && noteStyleItems.length > 0);
  return (
    <div className="mb-6" style={{ background: C.panel, border: `1px solid ${C.line}`, borderTop: `4px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{title}</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.inkFaint, marginBottom: 12 }}>{description}</p>
      {!hasItems && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.inkFaint, fontStyle: "italic" }}>{emptyText}</p>}
      {safetyStyleItems && safetyStyleItems.map((it, i) => (
        <div key={`s${i}`} className="flex items-start gap-2 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
          <LetterTag id={it.sectionId} status="in_progress" size="sm" />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.ink, paddingTop: 4 }}>{it.prompt}</p>
        </div>
      ))}
      {noteStyleItems && noteStyleItems.map((entry, i) => (
        <div key={`n${i}`} className="flex items-start gap-2 py-2" style={{ borderTop: i === 0 && !(safetyStyleItems && safetyStyleItems.length) ? "none" : `1px solid ${C.line}` }}>
          <LetterTag id={entry.section.id} status={entry.status} size="sm" />
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{entry.section.title}</p>
            {entry.notes.map((n, ni) => (
              <p key={ni} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.inkSoft, marginBottom: 3 }}>“{n}”</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityPlanView({ allData, onExit }) {
  const safetyItems = collectSafetyItems(allData);
  const essential = collectBarrierNotes(allData, ["D", "E", "F"]);
  const independence = collectBarrierNotes(allData, ["G", "H", "I", "J", "N"]);
  const future = collectBarrierNotes(allData, ["K", "L", "M"]);
  const P = allData.P?.answers || {};
  const A = allData.A?.answers || {};

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to your profile
      </button>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 8 }}>Accessibility Priority Plan</h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 8 }}>
        Not a $150,000 wish list — a sense of what needs attention now versus what can wait.
      </p>
      {P.p18 && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.accent, marginBottom: 28 }}>
          You told us <strong>{P.p18}</strong> feels most urgent to you.
        </p>
      )}
      {!P.p18 && <div style={{ marginBottom: 28 }} />}

      <PriorityCategory
        title="Immediate Safety"
        color={C.alert}
        description="Flagged directly from your answers — falls, evacuation risk, or feeling unsafe."
        safetyStyleItems={safetyItems}
        emptyText="Nothing flagged here yet — that's good news."
      />
      <PriorityCategory
        title="Essential Access"
        color={C.gold}
        description="Entrances, hallways, and the bathroom — the barriers that affect daily independence most directly."
        noteStyleItems={essential}
        emptyText="No specific notes yet from Sections D, E, or F."
      />
      <PriorityCategory
        title="Independence Improvements"
        color={C.accent}
        description="Kitchen, bedroom, stairs, laundry, and caregiver reliance — changes that reduce how much help you need day to day."
        noteStyleItems={independence}
        emptyText="No specific notes yet from Sections G, H, I, J, or N."
      />
      <PriorityCategory
        title="Future Planning"
        color={C.inkFaint}
        description="Living spaces, outdoor areas, and technology — worth planning for, less urgent right now."
        noteStyleItems={future}
        emptyText="No specific notes yet from Sections K, L, or M."
      />
      <ProfilePanel title="Optional Preferences" subtitle="From your stated goals">
        <Row label="Your overall goal" value={A.a14} />
        <Row label="Additional context" value={A.a15} />
      </ProfilePanel>
    </div>
  );
}

/* ---------------------------------------------------------------
   Deliverable: Contractor Preparation Package
----------------------------------------------------------------*/
function ContractorPackageView({ allData, onExit }) {
  const A = allData.A?.answers || {};
  const B = allData.B?.answers || {};
  const N = allData.N?.answers || {};
  const P = allData.P?.answers || {};
  const safetyItems = collectSafetyItems(allData);
  const measurementRows = collectMeasurements(allData);
  const barrierSections = collectBarrierNotes(allData, ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]);

  const questions = [];
  if (A.a13 === "Rent") questions.push("Can you help document this work in a way my landlord would need to approve it?");
  if (allData.D?.answers?.d4 === "Yes") questions.push("What ramp or lift options would fit our entrance, given the step height and available space?");
  if (P.p4) questions.push(`Our rough budget range is ${P.p4} — what scope of work is realistic within that?`);
  if (P.p13 === "Yes") questions.push("How would you sequence the work so I can keep living here during construction?");
  questions.push("Can you share references from other accessibility-focused projects?");
  questions.push("What's your estimated timeline, and what could extend it?");

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to your profile
      </button>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 8 }}>Contractor Preparation Package</h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 28 }}>
        Everything a contractor would ask for, gathered before they ever walk in the door.
      </p>

      <ProfilePanel title="Project summary">
        <Row label="This project is for" value={A.a2} />
        <Row label="Overall goal" value={A.a14} />
        <Row label="Home ownership" value={A.a13} />
        <Row label="Budget range" value={P.p4} />
        <Row label="Will remain home during construction" value={P.p13} />
      </ProfilePanel>

      <ProfilePanel title="Mobility device specifications" subtitle="From Section B">
        <Row label="Device type" value={B.b1} />
        <Row label="Overall width" value={formatAnswer({ type: "measurement" }, B.b2)} />
        <Row label="Occupied width" value={formatAnswer({ type: "measurement" }, B.b3)} />
        <Row label="Hand clearance" value={formatAnswer({ type: "measurement" }, B.b4)} />
        <Row label="Overall length" value={formatAnswer({ type: "measurement" }, B.b5)} />
        <Row label="Overall height" value={formatAnswer({ type: "measurement" }, B.b6)} />
        <Row label="Turning space needed" value={formatAnswer({ type: "measurement" }, B.b8)} />
        <Row label="Attachments" value={Array.isArray(B.b9) ? B.b9.join(", ") : B.b9} />
      </ProfilePanel>

      <ProfilePanel title="Caregiver access needs" subtitle="From Section N">
        <Row label="Has a caregiver" value={N.n1} />
        <Row label="Needs full-home access" value={N.n3} />
        <Row label="Space needed to assist with physical tasks" value={N.n5} />
      </ProfilePanel>

      {measurementRows.length > 0 && (
        <ProfilePanel title="Measurements by room" subtitle="Every recorded measurement, section by section">
          {measurementRows.map((r, i) => (
            <Row key={i} label={`${r.sectionId} — ${r.prompt}`} value={r.value} />
          ))}
        </ProfilePanel>
      )}

      {safetyItems.length > 0 && (
        <div className="mb-6" style={{ background: C.alertSoft, border: `1px solid ${C.alert}33`, borderRadius: 10, padding: "18px 20px" }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: C.alert, marginBottom: 10 }}>Safety priorities to flag with your contractor</p>
          {safetyItems.map((it, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5">
              <LetterTag id={it.sectionId} status="in_progress" size="sm" />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.alert, paddingTop: 4 }}>{it.prompt}</p>
            </div>
          ))}
        </div>
      )}

      {barrierSections.length > 0 && (
        <ProfilePanel title="Barrier notes, room by room">
          {barrierSections.map((entry) => (
            <div key={entry.section.id} className="py-2" style={{ borderTop: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2 mb-1">
                <LetterTag id={entry.section.id} status={entry.status} size="sm" />
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, color: C.ink }}>{entry.section.title}</p>
              </div>
              {entry.notes.map((n, i) => (
                <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.inkSoft, marginBottom: 3 }}>“{n}”</p>
              ))}
            </div>
          ))}
        </ProfilePanel>
      )}

      <ProfilePanel title="Questions to ask the contractor" subtitle="Generated from your answers">
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>• {q}</p>
          ))}
        </div>
      </ProfilePanel>

      <div style={{ background: C.bgAlt, borderRadius: 10, padding: "16px 18px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6 }}>
          AccessPath doesn't replace an occupational therapist, architect, or licensed contractor — this package is meant to help you arrive prepared, not to make professional determinations.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Deliverable: Funding & Documentation Checklist
----------------------------------------------------------------*/
function ChecklistRow({ label, note, status }) {
  // status: 'done' | 'todo' | 'na'
  const icon = status === "done" ? <Check size={16} color={C.accent} /> : status === "na" ? <X size={16} color={C.inkFaint} /> : <AlertTriangle size={16} color={C.gold} />;
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderTop: `1px solid ${C.line}` }}>
      <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: status === "na" ? C.inkFaint : C.ink }}>{label}</p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.inkFaint, lineHeight: 1.4 }}>{note}</p>
      </div>
    </div>
  );
}

function FundingChecklistView({ allData, onExit }) {
  const P = allData.P?.answers || {};
  const renting = P.p2 === "Rent";
  const mightHaveInsurance = P.p5 === "Yes" || P.p5 === "Not sure";
  const hasEstimates = P.p10 && P.p10 !== "No, not yet";

  const items = [
    { label: "Landlord or property-owner permission", note: "Needed before modifying a rented home.", status: !renting ? "na" : P.p3 === "Yes" ? "done" : "todo" },
    { label: "Insurance provider contacted", note: "Ask specifically about coverage for accessibility modifications.", status: !mightHaveInsurance ? "na" : P.p6 === "Yes" ? "done" : "todo" },
    { label: "Medicaid or public support program checked", note: "Some programs cover home modifications tied to medical need.", status: P.p7 === "Yes" ? "done" : P.p7 === "No" ? "na" : "todo" },
    { label: "Grant options explored", note: "Local and national accessibility grants can offset cost significantly.", status: P.p8 && P.p8.startsWith("Yes") ? "done" : "todo" },
    { label: "Financing plan identified, if needed", note: "A loan or payment plan, if the project needs one.", status: P.p9 === "No" ? "na" : P.p9 === "Yes" ? "todo" : "todo" },
    { label: "Contractor estimates collected", note: "At least one detailed estimate to work from.", status: hasEstimates ? "done" : "todo" },
    { label: "Estimates cover comparable scope", note: "So you're comparing apples to apples across bids.", status: !hasEstimates ? "na" : P.p11 === "Yes" ? "done" : "todo" },
    { label: "Contractor credentials verified", note: "License, insurance, and accessibility-specific experience.", status: P.p12 === "Yes" ? "done" : "todo" },
    { label: "Documentation ready for a contractor", note: "Measurements, photos, and your specific needs, organized.", status: P.p16 === "Yes, most of it" ? "done" : "todo" },
  ];

  const doneCount = items.filter((i) => i.status === "done").length;
  const applicableCount = items.filter((i) => i.status !== "na").length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to your profile
      </button>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 8 }}>Funding & Documentation Checklist</h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 8 }}>
        {applicableCount > 0
          ? `${doneCount} of ${applicableCount} applicable items are in place, based on Section P.`
          : "Answer Section P and this checklist will fill in automatically."}
      </p>
      <div className="mb-8"><ProgressBar pct={applicableCount ? Math.round((doneCount / applicableCount) * 100) : 0} /></div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "4px 20px" }}>
        {items.map((it, i) => (
          <ChecklistRow key={i} label={it.label} note={it.note} status={it.status} />
        ))}
      </div>

      <div style={{ background: C.bgAlt, borderRadius: 10, padding: "16px 18px", marginTop: 20 }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6 }}>
          AccessPath doesn't guarantee insurance coverage, grant approval, or financing — those need confirmation through the relevant provider or program. This checklist just tracks what you've covered so far.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Dashboard
----------------------------------------------------------------*/
function Dashboard({ allData, onOpen, onOpenProfile, onOpenPricing, onOpenPrivacy, onOpenTerms, overallPct, currentPlan }) {
  const tier = PRICING_TIERS.find((t) => t.id === currentPlan) || PRICING_TIERS[1];
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <div aria-live="polite" className="sr-only">AccessPath home dashboard</div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" style={{ color: C.accent }}>
          <HomeIcon size={18} />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>AccessPath</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1.5"
            style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", color: C.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 13, cursor: "pointer" }}
          >
            {tier.name}
          </button>
          <button
            onClick={onOpenPrivacy}
            style={{ background: "none", border: "none", color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
          >
            Privacy
          </button>
          <button
            onClick={onOpenTerms}
            style={{ background: "none", border: "none", color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
          >
            Terms
          </button>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5"
            style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", color: C.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 13, cursor: "pointer" }}
          >
            <FileText size={14} /> Profile
          </button>
        </div>
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, color: C.ink, fontWeight: 600, marginBottom: 8 }}>Plan a Safer, More Accessible Home</h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: C.inkSoft, lineHeight: 1.6, marginBottom: 30 }}>
        Your home assessment, in your own words — sixteen sections, one question at a time. Leave any time; nothing is lost.
      </p>

      <div className="flex items-center justify-between mb-2">
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.inkSoft, fontWeight: 500 }}>Overall progress</p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.accent }}>{overallPct}%</p>
      </div>
      <div className="mb-10"><ProgressBar pct={overallPct} height={8} /></div>

      <div className="flex flex-col gap-2">
        {SECTIONS.map((s) => {
          const data = allData[s.id] || { status: "not_started" };
          const pct = sectionPercent(s, data);
          const locked = isSectionLocked(s.id, currentPlan);
          return (
            <button
              key={s.id}
              onClick={() => (locked ? onOpenPricing() : onOpen(s.id))}
              className="flex items-center gap-4 text-left transition"
              style={{ background: locked ? C.bgAlt : C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", opacity: locked ? 0.75 : 1 }}
            >
              <LetterTag id={s.id} status={locked ? "not_started" : data.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: C.ink }}>{s.title}</p>
                  {!s.builtOut && !locked && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.inkFaint, border: `1px solid ${C.line}`, borderRadius: 4, padding: "1px 6px" }}>preview</span>}
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.inkFaint, marginBottom: 6 }}>{s.desc}</p>
                {!locked && <ProgressBar pct={pct} height={4} color={data.status === "not_applicable" ? C.inkFaint : C.accent} />}
              </div>
              <div className="flex flex-col items-end gap-1" style={{ flexShrink: 0 }}>
                {locked ? <Lock size={18} color={C.inkFaint} /> : <s.Icon size={18} color={C.inkFaint} />}
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: C.inkFaint }}>{locked ? "Upgrade to unlock" : STATUS_LABEL[data.status] || "Not started"}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Legal: Privacy Policy & Terms of Service
----------------------------------------------------------------*/
function LegalSection({ title, children }) {
  return (
    <div className="mb-6">
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{title}</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.inkSoft, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function PrivacyPolicyView({ onExit }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back
      </button>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.inkFaint, marginBottom: 28 }}>Last updated: August 10, 2026</p>

      <LegalSection title="Who we are">
        AccessPath ("we," "us," "our") provides a home-accessibility planning tool. This policy explains what information we collect, how we use it, and your choices.
      </LegalSection>
      <LegalSection title="Information we collect">
        Account information (your email, handled securely by our database provider, Supabase — we never see your raw password), and your assessment data, which may include details about your mobility needs, home layout, and safety concerns. We do not currently collect payment information or use any analytics or tracking tools.
      </LegalSection>
      <LegalSection title="How we use your information">
        To create and maintain your account, save your assessment progress across devices, and generate your Home Accessibility Profile and deliverables (Contractor Package, Priority Plan, Funding Checklist). We do not sell your personal information or share your assessment data with third parties for marketing.
      </LegalSection>
      <LegalSection title="Sensitive information">
        Some of what you enter — mobility limitations, disabilities, or home safety concerns — is sensitive. We store it only to provide the service to you, never for advertising, and don't share it except as described below.
      </LegalSection>
      <LegalSection title="Who we share information with">
        Supabase (our database provider) stores your data on our behalf. We may disclose information if required by law or to protect safety. We do not sell or rent your data.
      </LegalSection>
      <LegalSection title="Data retention & deletion">
        We keep your data as long as your account is active. You can request deletion of your account and data at any time by contacting hello.accesspath@outlook.com.
      </LegalSection>
      <LegalSection title="Your rights">
        You can access, update, or delete your assessment data by logging into your account, or request a full copy or deletion by contacting hello.accesspath@outlook.com.
      </LegalSection>
      <LegalSection title="Security">
        We use industry-standard practices (via Supabase) to protect your data, but no online service can guarantee perfect security.
      </LegalSection>
      <LegalSection title="Children's privacy">
        AccessPath is not directed at children under 13, and we do not knowingly collect information from children under 13.
      </LegalSection>
      <LegalSection title="Changes to this policy">
        We may update this policy as AccessPath grows — for example, if we add payment processing or analytics. We'll update the date above when we do.
      </LegalSection>
      <LegalSection title="Contact us">
        Questions about this policy? Contact us at hello.accesspath@outlook.com.
      </LegalSection>
    </div>
  );
}

function TermsOfServiceView({ onExit }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-14">
      <button onClick={onExit} className="flex items-center gap-1 mb-8" style={{ color: C.inkFaint, fontFamily: "'Inter', sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back
      </button>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.inkFaint, marginBottom: 28 }}>Last updated: August 10, 2026</p>

      <LegalSection title="Acceptance of terms">
        By using AccessPath, you agree to these Terms of Service. If you don't agree, please don't use the app.
      </LegalSection>
      <LegalSection title="What AccessPath is (and isn't)">
        AccessPath is a self-guided planning tool to help you document home-accessibility needs and prepare for renovations. It is not professional medical, occupational therapy, legal, or contracting advice. Always consult qualified professionals before making renovation or safety decisions.
      </LegalSection>
      <LegalSection title="Your account">
        You must provide accurate information when creating an account, keep your login credentials secure, and be at least 18 years old (or the age of majority in your location).
      </LegalSection>
      <LegalSection title="Acceptable use">
        You agree not to use AccessPath for any unlawful purpose, attempt to access other users' accounts or data, or interfere with the app or its infrastructure.
      </LegalSection>
      <LegalSection title="Pricing tiers">
        AccessPath currently offers Free, Full Assessment, and Contractor Ready tiers. Paid tiers are not yet available for purchase; this section will be updated when payment processing is enabled.
      </LegalSection>
      <LegalSection title="Intellectual property">
        The AccessPath app, design, and content are owned by us. Your assessment answers and generated deliverables belong to you — you're free to use, print, or share your own Contractor Package, Priority Plan, and Funding Checklist as you see fit.
      </LegalSection>
      <LegalSection title="Disclaimer of warranties">
        AccessPath is provided "as is." We do not guarantee the app will be error-free, uninterrupted, or that it fully captures every accessibility need for your specific situation.
      </LegalSection>
      <LegalSection title="Limitation of liability">
        To the fullest extent permitted by law, we are not liable for damages arising from your use of AccessPath, including decisions made based on your assessment results. Renovation, safety, and medical decisions should always involve qualified professionals.
      </LegalSection>
      <LegalSection title="Changes to these terms">
        We may update these terms as the app evolves. Continued use after changes means you accept the updated terms.
      </LegalSection>
      <LegalSection title="Governing law">
        These terms are governed by the laws of Maryland, USA.
      </LegalSection>
      <LegalSection title="Contact us">
        Questions? Contact us at hello.accesspath@outlook.com.
      </LegalSection>
    </div>
  );
}
/* ---------------------------------------------------------------
   Root app
----------------------------------------------------------------*/
export default function AccessPathApp({ userId, userEmail }) {
  const [allData, setAllData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showContractor, setShowContractor] = useState(false);
  const [showFunding, setShowFunding] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [currentPlan, setCurrentPlan] = useState("complete");

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(SECTIONS.map(async (s) => [s.id, await loadSection(s.id)]));
      setAllData(Object.fromEntries(entries));
      try {
        const planRes = await window.storage.get("accesspath:plan");
       if (planRes && planRes.value) {
          const parsed = JSON.parse(planRes.value);
          const planId = typeof parsed === "string" ? parsed : parsed.planId;
          if (planId) setCurrentPlan(planId);
        }
      } catch (e) {
        /* no plan saved yet — default stands */
      }
    })();
  }, []);

  const handleSelectPlan = async (planId) => {
    setCurrentPlan(planId);
    try {
      await window.storage.set("accesspath:plan", JSON.stringify(planId));
    } catch (e) {
      console.error("AccessPath: failed to save plan", e);
    }
    setShowPricing(false);
  };

  const handleStartCheckout = async (planId) => {
    try {
      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userId, userEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // send them to Stripe's real checkout page
      } else {
        console.error("AccessPath: checkout error", data);
        alert("Sorry, something went wrong starting checkout. Please try again.");
      }
    } catch (e) {
      console.error("AccessPath: checkout error", e);
      alert("Sorry, something went wrong starting checkout. Please try again.");
    }
  };

  const handleSave = (id, next) => {
    setAllData((prev) => ({ ...prev, [id]: next }));
    saveSection(id, next);
  };

  if (!allData) {
    return (
      <div style={{ background: C.bg, minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", color: C.inkFaint, fontSize: 14 }}>Loading your assessment…</p>
      </div>
    );
  }

  const overallPct = Math.round(SECTIONS.reduce((sum, s) => sum + sectionPercent(s, allData[s.id]), 0) / SECTIONS.length);
  const activeSection = SECTIONS.find((s) => s.id === activeId);

  return (
    <div style={{ background: C.bg, minHeight: 500, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>
      {showPricing && <PricingView currentPlan={currentPlan} onSelectPlan={handleSelectPlan} onStartCheckout={handleStartCheckout} onExit={() => setShowPricing(false)} />}
      {!showPricing && showPrivacy && <PrivacyPolicyView onExit={() => setShowPrivacy(false)} />}
{!showPricing && !showPrivacy && showTerms && <TermsOfServiceView onExit={() => setShowTerms(false)} />}  
      {!showPricing && showPriority && <PriorityPlanView allData={allData} onExit={() => setShowPriority(false)} />}
      {!showPricing && showContractor && <ContractorPackageView allData={allData} onExit={() => setShowContractor(false)} />}
      {!showPricing && showFunding && <FundingChecklistView allData={allData} onExit={() => setShowFunding(false)} />}
      {!showPricing && !showPriority && !showContractor && !showFunding && showProfile && (
        <ProfileView
          allData={allData}
          onExit={() => setShowProfile(false)}
          currentPlan={currentPlan}
          onOpenPriority={() => setShowPriority(true)}
          onOpenContractor={() => setShowContractor(true)}
          onOpenFunding={() => setShowFunding(true)}
          onOpenPricing={() => setShowPricing(true)}
        />
      )}
      {!showPricing && !showPriority && !showContractor && !showFunding && !showPrivacy && !showTerms && !showProfile && !activeSection && (
        <Dashboard
          allData={allData}
          onOpen={setActiveId}
          onOpenProfile={() => setShowProfile(true)}
          onOpenPricing={() => setShowPricing(true)}
          onOpenPrivacy={() => setShowPrivacy(true)}
        onOpenTerms={() => setShowTerms(true)}
          overallPct={overallPct}
          currentPlan={currentPlan}
        />
      )}
      {!showPricing && !showPriority && !showContractor && !showFunding && !showPrivacy && !showTerms && !showProfile && activeSection && activeSection.builtOut && (
        <SectionFlow
          section={activeSection}
          data={allData[activeSection.id]}
          onExit={() => setActiveId(null)}
          onSave={(next) => handleSave(activeSection.id, next)}
        />
      )}
      {!showPricing && !showPriority && !showContractor && !showFunding && !showPrivacy && !showTerms && !showProfile && activeSection && !activeSection.builtOut && (
        <NotBuiltSection
          section={activeSection}
          data={allData[activeSection.id]}
          onExit={() => setActiveId(null)}
          onMarkNA={() => handleSave(activeSection.id, { status: allData[activeSection.id]?.status === "not_applicable" ? "not_started" : "not_applicable", answers: {}, lastIndex: 0 })}
        />
      )}
    </div>
  );
}
