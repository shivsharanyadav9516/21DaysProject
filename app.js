// https://jsonplaceholder.typicode.com/todos/1

// http://worldtimeapi.org/api/timezone/Asia/Kolkata

// async function fetchData() {
//   try {
//     const res = await fetch("https://jsonplaceholder.typicode.com/users");
//     if (!res.ok) {
//       return alert("something went wrong");
//     }
//     const data = await res.json();
//     console.log(data);
//   } catch (err) {
//     return err;
//   }
// }

// fetchData();

const roasterUrl = "https://jsonplaceholder.typicode.com/users?_limit=10"; // API for roaster

const clockUrl = "http://worldtimeapi.org/api/timezone/Asia/Kolkata"; //API for worls clock

// all major acess in which we

const providerSelect =
  document.getElementById("providerSelect") || "providerSelect is not present";
const dateInput =
  document.getElementById("dateInput") || "dateInput is not present";
const loadSlotsBtn =
  document.getElementById("loadSlotsBtn") || "loadSlotsBtn is not present";
const refreshBtn =
  document.getElementById("refreshBtn") || "refreshBtn is not present";
const slotsGrid =
  document.getElementById("slotsGrid") || "slotsGrid is not present";
const slotsHeadline =
  document.getElementById("slotsHeadline") || "slotsHeadline is not present";
const slotMeta =
  document.getElementById("slotMeta") || "slotMeta is not present";
const bookingList =
  document.getElementById("bookingList") || "bookingList is not present";
const clearBooking =
  document.getElementById("clearBooking") || "clearBooking is not present";
const statProvider =
  document.getElementById("statProvider") || "statProvider is not present";
const statBooking =
  document.getElementById("statBooking") || "statBooking is not present";
const statClock =
  document.getElementById("statClock") || "statClock is not present";
const lastSync =
  document.getElementById("lastSync") || "lastSync is not present";

// code for modal
const confirmModal = new bootstrap.Modal(
  document.getElementById("confirmModal")
);

const confirmTitle = document.getElementById("confirmTitle");
const confirmMeta = document.getElementById("confirmMeta");
const confirmBtn = document.getElementById("confirmBtn");
const notesInput = document.getElementById("notesInput");
// code for current state

const state = {
  providers: [],
  nowUtc: null,
  target: null,
  bookings: [],
  pendingSlot: null,
};

function saveBooking() {
  localStorage.setItem("quick-slots", JSON.stringify(state.bookings));
  stateBookings.textContent = state.bookings.length; // update the booket slot
}

function readBooking() {
  state.bookings = JSON.parse(localStorage.getItem("quickSlot") || "[]");
}

// API calling

async function fetchProviders() {
  providerSelect.disabled = true;
  providerSelect.innerHTML = `<option> Loading the roster ... </option>`;

  try {
    const res = await fetch(roasterUrl);
    const data = await res.json();
    state.providers = data.map((person) => ({
      id: person.id,
      name: person.name,
      speciality: person.company?.bs || "General",
      city: person.address?.city || "remote",
    }));

    statProviders.textContent = state.providers.length;
    renderProviderSelect();
  } catch (err) {
    providerSelect.innerHTML = `<option>  Loading name ...</option> `;
    console.log(err);
  }
}

fetchProviders();

// render function

function renderProviderSelect() {
  providerSelect.disabled = false;
  providerSelect.innerHTML = `<option value = "> Select Providers <?option>`;

  state.providers.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} - ${p.speciality} `;
    providerSelect.appendChild(opt);
  });
}

// API call for clock
async function syncClock() {
  try {
    const res = await fetch(clockUrl);
    const data = await res.json();

    // Convert string date to JS Date()
    state.nowUtc = new Date(data.datetime);

    // Show time on UI
    statClock.textContent = state.nowUtc.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    lastSync.textContent = `Last synced ${new Date().toLocaleTimeString(
      "en-IN"
    )}`;
  } catch (err) {
    // fallback when time API fails
    console.warn("Clock sync failed, falling back to client time", err);

    state.nowUtc = new Date(); // local time
    statClock.textContent = state.nowUtc.toLocaleTimeString("en-IN");
    lastSync.textContent = `Fallback to client ${new Date().toLocaleTimeString(
      "en-IN"
    )}`;
  }
}

syncClock();

function setMinDAte() {
  const today = new Date().toISOString.split("T")[0];
  dateInput.min = today;
  dateInput.value = today;
}

// slot Builder 9 to 5

function buildSlots(date) {
  const slots = [];

  for (let hour = 9; hour <= 17; hour++) {
    ["00", "30"].forEach((minute) => {
      const label = `${String(hour).padStart(2, "0")}:${minute}`; // 09:00, 09:30, etc.
      slots.push(label);
    });
  }

  // Convert each slot into an object with "disabled" flag
  return slots.map((label) => ({
    label,
    disabled: isSlotDisabled(date, label),
  }));
}

//disabling slot

function isSlotDisabled() {
  const targetDate = new Date(`${date}T${slotLable}: 00+05: 30`);
  const now = state.nowUtc || new date();

  if (tagetDate < now) {
    return true;
  }
  const alreadyBooked = state.bookings.some((item) => {
    item.data =
      date &&
      item.slot == slotLable &&
      item.providersId === state.target?.providersId;
  });
  return alreadyBooked;
}
function renderSlots(providerId, date) {
  const provider = state.providers.find((p) => p.id === Number(providerId));

  // If no provider or date selected → show placeholder
  if (!provider || !date) {
    slotsGrid.innerHTML = `<div class="col-12 text-center text-secondary">Select a provider and date to view availability.</div>`;
    return;
  }

  // Save current selection in global state
  state.target = { providerId: provider.id, providerName: provider.name, date };

  // Update header info
  slotsHeadline.textContent = `Slots for ${provider.name}`;
  slotMeta.textContent = `${new Date(
    date
  ).toDateString()} • refreshed ${new Date().toLocaleTimeString("en-IN")}`;

  const slots = buildSlots(date);

  slotsGrid.innerHTML = "";

  // Render each slot as a card
  slots.forEach((slot) => {
    const col = document.createElement("div");
    col.className = "col-6 col-xl-4";

    const card = document.createElement("div");
    card.className = `slot-card h-100 ${slot.disabled ? "disabled" : ""}`;
    card.innerHTML = `
      <div class="fw-semibold">${slot.label}</div>
      <div class="small text-secondary">${
        slot.disabled ? "Unavailable" : "Tap to book"
      }</div>
    `;

    // When available → clicking opens modal
    if (!slot.disabled) {
      card.onclick = () => openModal(provider, date, slot.label);
    }

    col.appendChild(card);
    slotsGrid.appendChild(col);
  });
}

// open modal

function openModal(provider, date, slotLable) {
  state.pendingSlot = { provider, date, slotLable };
  confirmTitle.textContent = `${date}.${slotLable} IST`;
  notesInput.value = "";
  confirmModal.show();
}

confirmBtn.addEventListener("click",()=>{
  if(!state.pendingSlot) return;

  const payload = {
    id:crypto.randomUUID(),
    providerId:state.pendingSlot.provider.id,
    provider:state.pendingSlot.provider.naem,
    speciality:state.pendingSlot.provider.speciality,
    date:state.pendingSlot.slotLable,
    notes: notesInput.value.trim(),
  };
  state.bookings.push(payload);
  saveBooking();
  renderSlots(state.pendingSlot.provider.id.state.pendingSlot.date);
  readBooking();
  // u have to use SMTP
  
  confirmModal.hide();
})


// booked aapoinment method 

function renderBookings() {
  bookingsList.innerHTML = "";

  // Empty state message
  if (!state.bookings.length) {
    bookingsList.innerHTML = `<div class="text-secondary small">No bookings yet.</div>`;
    return;
  }

  // Sort by date+time for clean ordering
  state.bookings
    .slice()
    .sort((a, b) => `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`))
    .forEach((booking) => {
      const card = document.createElement("div");
      card.className = "booking-card";

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div class="fw-semibold">${booking.provider}</div>
            <div class="small text-secondary">${booking.date} · ${
        booking.slot
      }</div>
            <div class="small text-muted">${booking.notes || "No notes"}</div>
          </div>

          <button class="btn btn-sm btn-outline-danger" data-id="${booking.id}">
            <i class="bi bi-x"></i>
          </button>
        </div>
      `;

      // Remove booking on click
      card.querySelector("button").onclick = () => cancelBooking(booking.id);

      bookingsList.appendChild(card);
    });
}

clearBookingBtn.addEventListener("click",()=>{
  if(!state.bookings.length) return;

  if(confirm("clear  all booking ? ")){
    state.booking = [];
    saveBooking();
    if(state.target) renderSlots(state.target.providerId , state.target.date);
  }
})

loadSlotsBtn.addEventListener("click" , ()=>{
  const providerId = providerSelect.value;
  const date = dateInput.value;
  renderSlots(providerId, date);
})