class DaysRow {
    constructor(startTime, endTime) {
      this.startTime = startTime;
      this.endTime = endTime;
      this.domElement = this.render();
    }
  
    render() {
      const daysRow = document.createElement('div');
      daysRow.className = 'timeline-days-row';
      daysRow.classList.add('timeline-row');
      // start with startTime
      let currentDate = new Date(this.startTime);
      // loop until we reach endTime
      while (currentDate < this.endTime) {
        const day = document.createElement('div');
        day.classList.add('timeline-block');
        day.classList.add('day');
        day.innerText = currentDate.toLocaleDateString('en-GB', { weekday: 'short' });
        day.style.left = `${this.dateToOffset(currentDate)}%`;
        const dayWidth = 100 / ((this.endTime - this.startTime) / (1000 * 60 * 60 * 24));
        day.style.width = `${dayWidth}%`;
        daysRow.appendChild(day);
        // add a day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return daysRow;
    }
  
    dateToOffset = (date) => {
      const timeRange = this.endTime - this.startTime;
      return ((date - this.startTime) / timeRange) * 100;
    }
  
  }

  export default DaysRow;