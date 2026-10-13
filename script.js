const API = " http://127.0.0.1:8000";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const form = $("#form");
const stepFields = {
  0: ["age", "country", "gender", "academic_Level"],
  1: ["most_Used_Platform", "purpose_Of_Use", "avg_daily_Usage_Hours", "daily_Unlocks"],
  2: ["study_Hours", "physical_Activity_Hours", "sleep_Hours_Per_Night", "stress_Level"]
};
const platforms = ["Facebook", "LinkedIn", "Instagram", "Snapchat", "Twitter", "YouTube", "TikTok", "LINE", "KakaoTalk", "VKontakte", "WhatsApp", "WeChat"];
const hours = ["avg_daily_Usage_Hours", "study_Hours", "physical_Activity_Hours", "sleep_Hours_Per_Night"];
let currentStep = 0;
let messageTimer;

$("#platforms").innerHTML = platforms.map(platform =>
  `<label><input type="radio" name="most_Used_Platform" value="${platform}"><span>${platform}</span></label>`
).join("");

function value(name) {
  const field = form.elements[name];
  return String(field?.value ?? "").trim();
}

function readForm() {
  const number = name => value(name) === "" ? NaN : Number(value(name));
  return {
    age: number("age"),
    gender: value("gender"),
    country: value("country"),
    academic_Level: value("academic_Level"),
    most_Used_Platform: value("most_Used_Platform"),
    purpose_Of_Use: value("purpose_Of_Use"),
    avg_daily_Usage_Hours: number("avg_daily_Usage_Hours"),
    daily_Unlocks: number("daily_Unlocks"),
    study_Hours: number("study_Hours"),
    physical_Activity_Hours: number("physical_Activity_Hours"),
    sleep_Hours_Per_Night: number("sleep_Hours_Per_Night"),
    stress_Level: value("stress_Level")
  };
}

function errorElement(name) {
  return $(`.err[data-for="${name}"]`);
}

function setFieldError(name, message) {
  const error = errorElement(name);
  if (!error) return;
  error.textContent = message;
  error.closest(".field")?.classList.add("invalid");
}

function clearErrors() {
  $$(".err").forEach(error => error.textContent = "");
  $$(".invalid").forEach(field => field.classList.remove("invalid"));
  $("#alert").hidden = true;
}

function validate(data, step) {
  const errors = {};
  if (!Number.isInteger(data.age) || data.age < 1 || data.age > 100) errors.age = "Use a whole number from 1 to 100.";
  if (!data.country) errors.country = "Enter a country or choose Other.";
  ["gender", "academic_Level", "purpose_Of_Use", "stress_Level"].forEach(name => {
    if (!data[name]) errors[name] = "Select one option to continue.";
  });
  if (!data.most_Used_Platform) errors.most_Used_Platform = "Choose the platform used most.";
  if (!Number.isInteger(data.daily_Unlocks) || data.daily_Unlocks < 0) errors.daily_Unlocks = "Use a whole number of 0 or more.";
  hours.forEach(name => {
    if (!(data[name] >= 0 && data[name] <= 24)) errors[name] = "Enter a value between 0 and 24 hours.";
  });
  const totalHours = hours.reduce((sum, name) => sum + (Number.isFinite(data[name]) ? data[name] : 0), 0);
  if (totalHours > 24) errors[hours.find(name => data[name] > 0) || hours[0]] = "The daily total cannot exceed 24 hours.";
  return Object.fromEntries(Object.entries(errors).filter(([name]) => step === undefined || stepFields[step].includes(name)));
}

function showAlert(title, description) {
  const alert = $("#alert");
  alert.innerHTML = `<strong>${title}</strong><span>${description}</span>`;
  alert.hidden = false;
  alert.scrollIntoView({ behavior: "smooth", block: "center" });
}

function go(step) {
  currentStep = Math.max(0, Math.min(2, step));
  $$(".step").forEach((panel, index) => panel.classList.toggle("on", index === currentStep));
  $$("#stepper li").forEach((item, index) => {
    item.classList.toggle("on", index === currentStep);
    item.classList.toggle("done", index < currentStep);
  });
  $("#progress").style.width = `${((currentStep + 1) / 3) * 100}%`;
  $("#back").hidden = true;
  $("#next").hidden = true;
  $("#submit").hidden = false;
}

function updateDay(changedSlider) {
  const entries = [
    ["avg_daily_Usage_Hours", "Social media", "#ff9900"],
    ["study_Hours", "Study", "#5478ff"],
    ["physical_Activity_Hours", "Activity", "#19b98a"],
    ["sleep_Hours_Per_Night", "Sleep", "#a56cff"]
  ];
  let total = entries.reduce((sum, [name]) => sum + Number(value(name) || 0), 0);
  if (changedSlider && total > 24) {
    const otherHours = entries
      .filter(([name]) => name !== changedSlider.name)
      .reduce((sum, [name]) => sum + Number(value(name) || 0), 0);
    const allowed = Math.max(0, 24 - otherHours);
    changedSlider.value = Math.min(Number(changedSlider.value), allowed).toFixed(1);
    changedSlider.style.setProperty("--p", `${Number(changedSlider.value) / Number(changedSlider.max) * 100}%`);
    $(`[data-out="${changedSlider.name}"]`).textContent = `${changedSlider.value} h`;
    total = otherHours + Number(changedSlider.value);
  }
  $("#day").innerHTML = entries.map(([name, , color]) =>
    `<i style="width:${Math.min(Number(value(name) || 0) / Math.max(total, 24) * 100, 100)}%;background:${color}"></i>`
  ).join("");
  $("#legend").innerHTML = entries.map(([name, label, color]) =>
    `<li><i style="background:${color}"></i>${label}<b>${value(name) || 0} h</b></li>`
  ).join("");
  const free = 24 - total;
  $("#free").className = `free${free < 0 ? " over" : ""}`;
  $("#free").textContent = free < 0 ? `${Math.abs(free).toFixed(1)} h over a 24-hour day` : free === 0 ? "24 h allocated — no time left in the day" : `${free.toFixed(1)} h left for everything else`;
}

$$(".slider").forEach(slider => {
  const update = () => {
    slider.style.setProperty("--p", `${Number(slider.value) / Number(slider.max) * 100}%`);
    $(`[data-out="${slider.name}"]`).textContent = `${slider.value} h`;
    updateDay(slider);
  };
  slider.addEventListener("input", update);
  update();
});

function showView(resultVisible) {
  $("#mainCard").hidden = false;
  $(".side").hidden = false;
  $("#result").hidden = true;
  if (!resultVisible) {
    $("#sideTitle").textContent = "Your score will appear here";
    $("#sideText").textContent = "Complete the check-in and submit to generate a predicted wellbeing score.";
    $("#sideScore").innerHTML = `0.0<small>/10</small>`;
  }
  if (resultVisible) $(".side").scrollIntoView({ behavior: "smooth", block: "start" });
}

const loadingMessages = ["Reading your routine", "Finding meaningful patterns", "Running the wellbeing model", "Preparing your personal snapshot"];
function startLoading() {
  showView(true);
  $(".side").classList.remove("score-ready");
  $("#sideScore").classList.remove("score-pop");
  $("#gauge").dataset.state = "loading";
  $(".res-top").className = "res-top";
  $("#badge").textContent = "Analysing";
  $("#resTitle").textContent = loadingMessages[0];
  $("#resText").textContent = "Your score is being calculated securely in a few seconds.";
  $("#num").textContent = "…";
  $("#max").textContent = "";
  $("#insights").innerHTML = `<div class="loading-dots"><i></i><i></i><i></i></div>`;
  $("#sideTitle").textContent = "Reading your signal";
  $("#sideText").textContent = "Running your habits through the wellbeing model.";
  $("#sideScore").innerHTML = `<span class="side-loading">•••</span><small>/10</small>`;
  let index = 0;
  clearInterval(messageTimer);
  messageTimer = setInterval(() => {
    index = (index + 1) % loadingMessages.length;
    $("#resTitle").textContent = loadingMessages[index];
  }, 850);
}

function scoreBand(score) {
  if (score < 40) return ["low", "Needs attention", "A few gentle changes to sleep, movement and screen time may support a healthier routine."];
  if (score < 70) return ["mid", "Room to grow", "Your routine has a mixed pattern. Small, consistent adjustments can make a meaningful difference."];
  return ["good", "Looking healthy", "Your answers show several positive habits. Keep protecting the balance that works for you."];
}

function insightCards(data) {
  const card = (tone, label, metric, copy, tag) => ({ tone, label, metric, copy, tag });
  return [
    data.sleep_Hours_Per_Night >= 7
      ? card("ok", "Sleep", `${data.sleep_Hours_Per_Night} h`, "Within the recommended 7–9 hour range.", "On track")
      : card("warn", "Sleep", `${data.sleep_Hours_Per_Night} h`, "A little more rest could help your recovery.", "Opportunity"),
    data.avg_daily_Usage_Hours <= 3
      ? card("ok", "Screen time", `${data.avg_daily_Usage_Hours} h`, "A lighter level of daily social use.", "Balanced")
      : card("warn", "Screen time", `${data.avg_daily_Usage_Hours} h`, "Try creating a few phone-free pockets.", "Opportunity"),
    data.physical_Activity_Hours >= 1
      ? card("ok", "Movement", `${data.physical_Activity_Hours} h`, "You are making room for daily movement.", "Active")
      : card("warn", "Movement", `${data.physical_Activity_Hours} h`, "A short daily walk is a great place to start.", "Opportunity"),
    card(data.stress_Level === "Low" ? "ok" : "warn", "Stress", data.stress_Level, data.stress_Level === "Low" ? "Stress looks manageable today." : "A calmer routine may be worth prioritising.", "Personal signal")
  ];
}

function celebrate() {
  const layer = document.createElement("div");
  layer.className = "confetti";
  for (let i = 0; i < 42; i++) {
    const piece = document.createElement("i");
    piece.style.setProperty("--x", `${Math.random() * 100}vw`);
    piece.style.setProperty("--delay", `${Math.random() * .45}s`);
    piece.style.setProperty("--rot", `${Math.random() * 360}deg`);
    piece.style.setProperty("--color", ["#ff9900", "#19b98a", "#5478ff", "#e5484d"][i % 4]);
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2200);
}

function showResult(score, data) {
  clearInterval(messageTimer);
  const max = score > 10 ? 100 : 10;
  const percent = Math.min(Math.max(score / max, 0), 1);
  const [tone, title, copy] = scoreBand(percent * 100);
  const gauge = $("#gauge");
  gauge.dataset.state = "done";
  gauge.dataset.tone = tone;
  $(".res-top").className = `res-top ${tone}`;
  $("#badge").textContent = title;
  $("#resTitle").textContent = "Your wellbeing snapshot is ready";
  $("#resText").textContent = copy;
  $("#max").textContent = `out of ${max}`;
  $("#insights").innerHTML = insightCards(data).map((item, index) =>
    `<div class="ins ${item.tone}" style="animation-delay:${index * .1 + .2}s"><small>${item.label}</small><strong>${item.metric}</strong><p>${item.copy}</p><em>${item.tag}</em></div>`
  ).join("");
  $("#sideTitle").textContent = title;
  $("#sideText").textContent = copy;
  $("#sideScore").innerHTML = `<span></span><small>/10</small>`;
  const side = $(".side");
  side.classList.remove("score-ready", "score-warning", "score-positive");
  $("#sideScore").classList.remove("score-pop");
  void $(".side").offsetWidth;
  side.classList.add("score-ready", score < 6 ? "score-warning" : "score-positive");
  $("#sideScore").classList.add("score-pop");
  requestAnimationFrame(() => $("#arc").style.strokeDashoffset = 100 - percent * 100);
  const started = performance.now();
  const count = now => {
    const progress = Math.min((now - started) / 1500, 1);
    const value = (score * (1 - Math.pow(1 - progress, 3))).toFixed(2);
    $("#num").textContent = value;
    $("#sideScore span").textContent = value;
    if (progress < 1) requestAnimationFrame(count);
  };
  requestAnimationFrame(count);
}

async function submit(event) {
  event.preventDefault();
  clearErrors();
  const data = readForm();
  const errors = validate(data);
  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));
    const first = Math.min(...Object.keys(errors).map(name => Object.keys(stepFields).find(step => stepFields[step].includes(name))));
    go(first);
    showAlert("Almost there", "Review the highlighted answers before calculating your score.");
    return;
  }
  startLoading();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(typeof body?.detail === "string" ? body.detail : `The API returned ${response.status}.`);
    if (typeof body?.predicted_mental_health_score !== "number") throw new Error("The API did not return a predicted score.");
    showResult(body.predicted_mental_health_score, data);
  } catch (error) {
    clearInterval(messageTimer);
    showView(false);
    showAlert(error.name === "AbortError" ? "The request took too long" : "We could not calculate your score", error.name === "AbortError" ? "Please check that the backend is running and try again." : `${error.message} Make sure the API is available at ${API}.`);
  } finally {
    clearTimeout(timeout);
  }
}

$("#next").addEventListener("click", () => {
  clearErrors();
  const errors = validate(readForm(), currentStep);
  if (Object.keys(errors).length) return Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));
  go(currentStep + 1);
});
$("#back").addEventListener("click", () => { clearErrors(); go(currentStep - 1); });
$("#edit").addEventListener("click", () => { showView(false); go(2); window.scrollTo({ top: 0, behavior: "smooth" }); });
$("#again").addEventListener("click", () => { form.reset(); $$(".slider").forEach(slider => slider.dispatchEvent(new Event("input"))); showView(false); go(0); window.scrollTo({ top: 0, behavior: "smooth" }); });
form.addEventListener("submit", submit);
form.addEventListener("input", event => {
  const error = errorElement(event.target.name);
  if (error) {
    error.textContent = "";
    error.closest(".field")?.classList.remove("invalid");
  }
});
form.addEventListener("keydown", event => {
  if (event.key === "Enter" && currentStep < 2 && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    $("#next").click();
  }
});

$$(".btn").forEach(button => button.addEventListener("click", event => {
  const ripple = document.createElement("i");
  ripple.className = "ripple";
  const rect = button.getBoundingClientRect();
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  button.append(ripple);
  setTimeout(() => ripple.remove(), 650);
}));

(async () => {
  const status = $("#status");
  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error();
    status.dataset.s = "ok";
    $("b", status).textContent = "API online";
  } catch {
    status.dataset.s = "down";
    $("b", status).textContent = "API offline";
  }
})();

go(0);
