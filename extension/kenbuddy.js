// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).
// Several foreground scripts can be declared
// and injected into the same or different pages.
'use strict';

/* MAIN */


async function fillToday(statusContainer, schedule, entropyMinutes) {
  var date = new Date();
  const startOfToday = startOfDay(date);
  const endOfToday = endOfDay(date);
  await fillFor(statusContainer, startOfToday, endOfToday, schedule, entropyMinutes);
}

async function fillMonth(statusContainer, currentDate, schedule, entropyMinutes) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfDay(currentDate);
  await fillFor(statusContainer, monthStart, monthEnd, schedule, entropyMinutes);
}

async function fillCurrentWeek(statusContainer, schedule, entropyMinutes) {
  var currentDate = new Date();
  const weekStart = getStartOfWeek(currentDate);
  const weekEnd = endOfDay(currentDate);
  await fillFor(statusContainer, weekStart, weekEnd, schedule, entropyMinutes);
}

var localSchedule = {};
var localEntropyMinutes = 0;
var showFillMonth = false;
var showFillWeek = true;
var showFillToday = false;
var allowEntriesInTheFuture = false;

(async function() {
  /* Make schedule and entropy configurable */
  localSchedule = await getObjectFromLocalStorage(SCHEDULE);
  if (!localSchedule) {
    localSchedule = DEFAULT_SCHEDULE;
    await saveObjectInLocalStorage(SCHEDULE, localSchedule);
  }

  localEntropyMinutes = await getObjectFromLocalStorage(ENTROPY_MINUTES);
  if (!localEntropyMinutes) {
    localEntropyMinutes = DEFAULT_ENTROPY_MINUTES;
    await saveObjectInLocalStorage(ENTROPY_MINUTES, localEntropyMinutes);
  }

  showFillMonth = await getObjectFromLocalStorage(SHOW_FILL_MONTH);
  if (!showFillMonth) {
    showFillMonth = DEFAULT_SHOW_FILL_MONTH;
    await saveObjectInLocalStorage(SHOW_FILL_MONTH, showFillMonth);
  }

  showFillWeek = await getObjectFromLocalStorage(SHOW_FILL_WEEK);
  if (!showFillWeek) {
    showFillWeek = DEFAULT_SHOW_FILL_WEEK;
    await saveObjectInLocalStorage(SHOW_FILL_WEEK, showFillWeek);
  }

  showFillToday = await getObjectFromLocalStorage(SHOW_FILL_DAY);
  if (!showFillToday) {
    showFillToday = DEFAULT_SHOW_FILL_DAY;
    await saveObjectInLocalStorage(SHOW_FILL_DAY, showFillToday);
  }

  /* Add button */
  const extDiv = document.createElement('div');
  extDiv.style.textAlign = 'center';
  extDiv.className = 'btn-group-kenbuddy';

  const extDiv2 = document.createElement('div');
  extDiv2.style.textAlign = 'center';
  extDiv2.className = 'btn-group-kenbuddy';

  const monthBtn = document.createElement('button');
  const monthBtn2 = document.createElement('button');
  const todayBtn = document.createElement('button');
  const weekBtn = document.createElement('button');
  
  if (showFillToday){
    todayBtn.type = 'button';
    todayBtn.innerText = browser.i18n.getMessage('fillAttendanceTodayTitle');
    extDiv.append(todayBtn);
  }

  if (showFillWeek) {
    weekBtn.type = 'button';
    weekBtn.innerText = browser.i18n.getMessage('fillAttendanceWeekTitle');
    extDiv.append(weekBtn);
  }

  if (showFillMonth){
    monthBtn.type = 'button';
    monthBtn.innerText = browser.i18n.getMessage('fillAttendanceMonthTitle');
    extDiv.append(monthBtn);
  }

  if (showFillMonth){
    monthBtn2.type = 'button';
    monthBtn2.innerText = browser.i18n.getMessage('fillAttendanceMonthTitle');
    extDiv2.append(monthBtn2);
  }

  // var selector = await checkElement('orgos-widget-attendance');
  console.log("waiting for month picker");
  var selector2 = await checkElement('kenjo-input-month-picker');

  var hasEntryForToday = false;
  var hasEntryForCurrentWeek = false;

  try {
    let date = new Date();
    const today = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));

    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = endOfDay(date);
    let auth = await getAuth();
    let user = await getUser(auth);
    hasEntryForToday = await userHasEntryFor(auth, user.ownerId, today);

    var count = 0;
    for (let day = startOfWeek; day <= endOfWeek; day.setDate(day.getDate() + 1)) {
      let result = await userHasEntryFor(auth, user.ownerId, day)
      if (!result && ((day.getDay() in localSchedule) && localSchedule[day.getDay()].length != 0)){
        hasEntryForCurrentWeek = false;
        break;
      }
      hasEntryForCurrentWeek = true;
      count++;
    }

  } catch (exception) {
    hasEntryForToday = false;
  }

  monthBtn.onclick = function() { this.disabled = "disabled"; fillMonth(this, new Date(), localSchedule, localEntropyMinutes); }
  monthBtn2.onclick = function() { this.disabled = "disabled"; fillMonth(this, new Date(document.querySelector("kenjo-input-month-picker").innerText), localSchedule, localEntropyMinutes); }

  if (hasEntryForToday){
    todayBtn.disabled = true;
    todayBtn.innerText = browser.i18n.getMessage('attendanceFilledTitle');
  } else {
    todayBtn.onclick = function() { this.disabled = "disabled"; fillToday(this, localSchedule, localEntropyMinutes); }
  }

  if (hasEntryForCurrentWeek){
    weekBtn.disabled = true;
    weekBtn.innerText = browser.i18n.getMessage('attendanceFilledTitle');
  } else {
    weekBtn.onclick = function() { this.disabled = "disabled"; fillCurrentWeek(this, localSchedule, localEntropyMinutes); }
  }
  
  // selector.append(extDiv);
  selector2.append(extDiv2);

  console.log("did append everything")
})();