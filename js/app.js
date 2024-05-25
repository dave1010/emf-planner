import Schedule from "./Schedule.js";
import Timeline from "./Timeline.js";

const fetchData = () => {
  return fetch('https://www.emfcamp.org/schedule/2024.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    });
};

const createTimelineFromJson = (data) => {
  const schedule = Schedule.createFromJson(data);
  const timelineElement = document.getElementById('timeline');
  new Timeline(timelineElement, schedule);
};

document.addEventListener('DOMContentLoaded', () => {
  fetchData()
    .then(createTimelineFromJson)
    .catch(error => {
      console.error('Error fetching the schedule:', error);
    });
});

