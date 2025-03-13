import * as $ from "jquery";
import * as audioTrigger from "./audioTrigger";
import * as Timer from "./timer";
import * as Random from "./elmishRandom";
import * as Utils from "./utils";

interface State {
  running: boolean,
  timerRunning: boolean,
  timerDuration: number,
  minimum: number,
  maximum: number,
  readNumber: boolean,
  playAudio: boolean,
  divider: string
}

interface GeneratorOutput {
  number: number,
  string: string
}

async function wrap() {

  const storageKeys = {
    minimum: "RANGE_MINIMUM",
    maximum: "RANGE_MAXIMUM",
    readNumber: "READ_NUMBER",
    playAudio: "PLAY_AUDIO",
    timerDuration: "DURATION_TIMER",
    divider: "DIVIDER_SYMBOL",
  };

  const URLs = {
    audioClick: "./Click.ogg",
    audioGong: "./Number_found.ogg",
    audioTimer: "./Timer_over.ogg",
  };

  const state: State = {
    running: false,
    timerRunning: false,
    timerDuration: Utils.loadData(storageKeys.timerDuration, 120),
    minimum: Utils.loadData(storageKeys.minimum, 1000),
    maximum: Utils.loadData(storageKeys.maximum, 100000),
    readNumber: Utils.loadData(storageKeys.readNumber, true),
    playAudio: Utils.loadData(storageKeys.playAudio, true),
    divider: Utils.loadData(storageKeys.divider, "."),
  };

  const display = $("#number");
  const print = ((obj: JQuery<HTMLElement>) => (text: string): boolean => {
    obj.text(text);
    return true;
  })(display);

  const synth = window.speechSynthesis;
  const voice = synth.getVoices().filter((v) => v.lang === "de-DE")[0];

  const buildGenerator = ({ minimum, maximum }: State): Random.Generator<GeneratorOutput> => {
    const padding = (maximum + "").length;
    return Random.int(minimum, maximum, Math.random).map((x) => {
      let arr = (x + "").split("").reverse();
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = i > 0 ? arr[i] + state.divider : arr[i];
      }
      return {
        number: x,
        string: arr.reverse().join("").padStart(padding, " "),
      };
    });
  };

  const timeouts: number[] = [
    10, 20, 30, 40, 50, 80, 100, 130, 160, 210, 260, 310, 390, 470, 550, 650,
    750, 850, 1000, 1150, 1300, 1600, 1900, 2200, 2700, 3200, 3700, 4500,
  ];
  //const timeouts = [100, 200];

  const timer = Timer.create("#timer", {
    size: 360,
    color: "#FFA07A ",
    background: "#292929",
    border: "#FF4500 ",
  });

  /* AUDIO */
  let gongSound = await audioTrigger.create(URLs.audioGong);
  let clickSound = await audioTrigger.create(URLs.audioClick);
  let timerSound = await audioTrigger.create(URLs.audioTimer);

  /* AUDIO END */

  const roll = (event) => {
    const rndGenerator = buildGenerator(state);

    display.removeClass("ready").addClass("rolling");
    print(rndGenerator.next().string);


    timeouts.forEach((t) => {
      window.setTimeout(() => {
        const x = rndGenerator.next();
        clickSound.trigger(state.playAudio);
        //console.log(x);
        print(x.string);
      }, t);
    });
    state.running = true;

    setTimeout(() => {
      const finalNumber = rndGenerator.next();
      display.addClass("ready").removeClass("rolling");
      print(finalNumber.string);

      gongSound.trigger(state.playAudio);

      if (state.readNumber) {
        const spokenNumber = new SpeechSynthesisUtterance(finalNumber.number + "");
        spokenNumber.voice = voice;
        window.setTimeout(
          () => synth.speak(spokenNumber),
          gongSound.audioBuffer.duration * 1000
        );
        spokenNumber.addEventListener("end", () => {
          startTimer();
          //state.running = false;
        });
      } else {
        startTimer();
        //state.running = false;
      }
    }, timeouts[timeouts.length - 1] + 1000);
  };

  const startTimer = () =>
    $("#timer canvas").fadeIn(800, () => {
      timer.start(state.timerDuration * 1000, timerDone);
    });

  const timerDone = () => {
    timerSound.trigger(state.playAudio);
    $("#timer canvas").fadeOut(600, () => {
      state.running = false;
    });
    //console.log(timer);
  };

  const saveRange = (minimum: number, maximum: number): boolean => {
    Utils.saveData(storageKeys.minimum, minimum);
    Utils.saveData(storageKeys.maximum, maximum);

    state.minimum = minimum;
    state.maximum = maximum;

    return true;
  };

  const numberize = <A>(value: A | A[]): number => {
    if (Array.isArray(value)) {
      return numberize(value[0]);
    }
    else if (typeof value === "number" && !isNaN(value)) {
      return value;
    }
    else if (typeof value === "string") {
      return parseInt(value, 10)
    }
    else {
      return NaN;
    }
  };
  const checkRange = () => {

    const minimum = numberize($("#range_from").val());
    const maximum = numberize($("#range_to").val());

    if (!isNaN(minimum) && !isNaN(maximum) && minimum < maximum) {
      return saveRange(minimum, maximum);
    } else {
      return false;
    }
  };

  const toggleSettings = (onscreen: boolean): boolean => {
    if (onscreen && checkRange()) {
      $("#range_from, #range_to").removeClass("invalid_input");
      $("#settings, #settings_filler, #settings_toggle").animate(
        {
          right: "-=250px",
          opacity: 1,
        },
        { duration: 600, easing: "swing" }
      );
    } else if (checkRange()) {
      $("#range_from, #range_to").removeClass("invalid_input");
      $("#settings, #settings_filler, #settings_toggle").animate(
        {
          right: "+=250px",
          opacity: 1,
        },
        { duration: 600 }
      );
    } else {
      $("#range_from, #range_to").addClass("invalid_input");
      return false;
    }
    return true;
  };

  const adjustStyles = (): void => {
    console.log("Resizing Settings Panel");
    $("#settings")
      .css({
        "height": $(window).height() - 75 + "px",
        "right": "-250px"
      });


    $("#settings_filler").css("right", "-250px");

    $("#settings_toggle").css("right", "-3px");

    //const timerHeight = $("#number").css("top"
  };

  $("#settings_toggle").on("click", (e) => {
    const onscreen = $(e.currentTarget).data("onscreen");
    if (toggleSettings(onscreen)) {
      $(e.currentTarget).data("onscreen", !onscreen);
    }
  });

  $("#read_number").on("input", (e) => {
    const checked = $(e.target).is(":checked");
    state.readNumber = checked;
    Utils.saveData(storageKeys.readNumber, checked);
  });

  $("#play_audio").on("input", (e) => {
    const checked = $(e.target).is(":checked");
    state.playAudio = checked;
    Utils.saveData(storageKeys.playAudio, checked);
  });

  $("#timer_duration").on("input", (e) => {
    const target = $(e.target);
    const value = parseInt(target.prop("value"), 10);
    if (!isNaN(value)) {
      state.timerDuration = value;
      target.removeClass("invalid_input");
      Utils.saveData(storageKeys.timerDuration, value);
    } else {
      target.addClass("invalid_input");
    }
  });

  $("#select_divider").on("input", (e) => {
    const target = $(e.target);
    const value = target.prop("value");
    if (value === "custom") {
      $("#custom_divider, label[for='custom_divider']")
        .css("display", "inline");
    } else {
      $("#custom_divider, label[for='custom_divider']")
        .css("display", "none");
      state.divider = value;
      Utils.saveData(storageKeys.divider, value);
    }
  });

  $("#custom_divider").on("input", (e) => {
    const value = $(e.target).prop("value");
    state.divider = value;
    Utils.saveData(storageKeys.divider, value);
  });

  $(() => {
    adjustStyles();

    $("#settings, #settings_filler, #settings_toggle").css("display", "inline");

    $("#range_from").val(state.minimum);
    $("#range_to").val(state.maximum);

    if (![".", ",", " ", ""].includes(state.divider)) {
      $("#custom_divider").val(state.divider);
      $("#custom_divider, label[for='custom_divider']").css(
        "display",
        "inline"
      );
      $("#select_divider").val("custom");
    } else {
      $("#custom_divider, label[for='custom_divider']").css("display", "none");
      $("#select_divider").val(state.divider);
    }

    // Toggle Settings
    if ($("#settings_toggle").data()["onscreen"] === undefined) {
      $("#settings_toggle").data("onscreen", false);
    } else if ($("#settings_toggle").data()["onscreen"]) {
      toggleSettings(false);
    } else {
      toggleSettings(true);
    }
  });

  $(window).on("resize", adjustStyles);

  $(document).on("keyup touchend", (event) => {
    if (state.running === false && event.which === 32) {
      event.preventDefault();
      roll(event);
    }
  });
}

wrap();
