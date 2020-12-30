var mainVue = new Vue({
  el: "#app",
  data: {
    stopwatchButtonShow: true,
    daconButtonShow: true,
    stopwatchContentShow: false,
    daconContentShow: false,
  },
  methods: {
    openStopwatchContent: function () {
      this.stopwatchButtonShow = false;
      this.daconButtonShow = false;
      setTimeout(() => {
        this.stopwatchContentShow = true;
      }, 700);
    },
    closeStopwatchContent: function () {
      this.stopwatchContentShow = false;
      setTimeout(() => {
        this.stopwatchButtonShow = true;
        this.daconButtonShow = true;
      }, 1000);
    },
  },
});
