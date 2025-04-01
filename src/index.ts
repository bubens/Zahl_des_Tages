import * as Audio from "./audioTrigger";
import * as Timer from "./timer";
import * as Random from "./elmishRandom";
import * as Utils from "./utils";
import * as Voice from "./voice";

const $ = Utils.safeQuerySelector;
const $$ = Utils.safeQuerySelectorAll;

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

interface Number {
  number: number,
  string: string
}

async function wrap() {

  const storageKeys = {
    minimum: "ZDT_RANGE_MINIMUM",
    maximum: "ZDT_RANGE_MAXIMUM",
    readNumber: "ZDT_READ_NUMBER",
    playAudio: "ZDT_PLAY_AUDIO",
    timerDuration: "ZDT_DURATION_TIMER",
    divider: "ZDT_DIVIDER_SYMBOL",
  };

  const URLs = {
    audioClick: "./Click.mp3",
    audioGong: "./Number_found.mp3",
    audioTimer: "./Timer_over.mp3",
  };

  const state: State = {
    running: false,
    timerRunning: false,
    timerDuration: Utils.loadData<number>(storageKeys.timerDuration, 120),
    minimum: Utils.loadData<number>(storageKeys.minimum, 1000),
    maximum: Utils.loadData<number>(storageKeys.maximum, 100000),
    readNumber: Utils.loadData<boolean>(storageKeys.readNumber, true),
    playAudio: Utils.loadData<boolean>(storageKeys.playAudio, true),
    divider: Utils.loadData<string>(storageKeys.divider, "."),
  };


  // How to show the number
  const display = (() => {
    const element = $<HTMLElement>("#number");
    const show = (text: string): boolean => {
      element.innerHTML = text;
      return true;
    };
    return { element, show };
  })();

  const insertDividers = (x: number): string => {
    const arr = (x + "").split("");
    const l = arr.length;
    // It works, I think I can explain it, but I want it gone...
    return arr.reduceRight((a, c, i) =>
      (l - i - 1) % 3 === 0 && l - 1 !== i
        ? c + state.divider + a
        : c + a, ""
    );
  };

  // construct a generator for the rnd-numbers
  const buildGenerator = ({ minimum, maximum }: State): Random.Generator<Number> => {
    const padding = (maximum + "").length;
    const generator =
      Random.int(minimum, maximum)
        .map(x => {
          return {
            string: insertDividers(x),
            number: x
          }
        });

    return generator;
  };


  // list of timeouts for the rolling animation
  const timeouts: number[] = [
    10, 20, 30, 40, 50, 80, 100, 130, 160, 210, 260, 310, 390, 470, 550, 650,
    750, 850, 1000, 1150, 1300, 1600, 1900, 2200, 2700, 3200, 3700, 4500,
  ];

  // consult timer.ts
  const timer = Timer.create("#timer", {
    size: 1000,
    color: "#FFA07A ",
    background: "#292929",
    border: "#FF4500 ",
  });

  /* AUDIO */
  let gongSound = await Audio.create(URLs.audioGong);
  let clickSound = await Audio.create(URLs.audioClick);
  let timerSound = await Audio.create(URLs.audioTimer);


  const roll = (event: Event) => {
    const randomGenerator = buildGenerator(state);

    adjustFontSize(insertDividers(state.maximum));

    display.element.classList.remove("ready", "initial")
    display.element.classList.add("rolling");
    display.show(randomGenerator.next().string);


    timeouts.forEach((t) => {
      window.setTimeout(() => {
        const x = randomGenerator.next();
        clickSound.trigger(state.playAudio);
        //console.log(x);
        display.show(x.string);
      }, t);
    });
    state.running = true;

    setTimeout(() => {
      const finalNumber = randomGenerator.next();
      display.element.classList.replace("rolling", "ready");
      display.show(finalNumber.string);

      gongSound.trigger(state.playAudio);

      if (state.readNumber && Voice.isAvailable) {
        window.setTimeout(
          () => Voice.speak(finalNumber.number + "", startTimer),
          gongSound.audioBuffer.duration * 1000
        );
      } else {
        startTimer();
        //state.running = false;
      }
    }, timeouts[timeouts.length - 1] + 1000);
  };

  const startTimer = () => {
    $<HTMLElement>("#timer canvas").style.display = "inline";
    timer.start(state.timerDuration * 1000, timerDone);
  };

  const timerDone = () => {
    timerSound.trigger(state.playAudio);
    $<HTMLElement>("#timer canvas").style.display = "none";
    state.running = false;
    //console.log(timer);
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

  const adjustFontSize = (testCase?: string): void => {
    const number = document.getElementById("number");
    const currentText = number.innerHTML;
    let fontSize = parseInt(number.style.fontSize || getComputedStyle(number).getPropertyValue("font-size"), 10);

    console.log(number.scrollWidth + "; " + number.clientWidth);
    number.innerHTML = testCase || currentText;
    if (number.scrollWidth > number.clientWidth) {
      while (number.scrollWidth > number.clientWidth) {
        fontSize -= 5;
        number.style.fontSize = fontSize + "px";
      }
    }
    else {
      const copy = document.createElement("div");
      copy.id = "numberCopy";
      const defaultFontSize = getComputedStyle(copy).getPropertyValue("font-size");
      number.style.fontSize = defaultFontSize;
    }
    number.innerHTML = currentText;
  };

  const adjustStyles = (): void => {
    adjustFontSize();
  };


  // Set up handlers:
  $<HTMLElement>("#settings_toggle").addEventListener("click", (e) => {
    const footer = $<HTMLInputElement>("footer");
    const className = "settings_shown";
    e.preventDefault();
    if (footer.classList.contains(className)) {
      footer.classList.remove(className);
    }
    else {
      footer.classList.add(className);
    }
  });

  $<HTMLElement>("#range_from").addEventListener("input", (e) => {
    const input = <HTMLInputElement>e.target;
    const value = numberize(input.value);
    if (isNaN(value) || value >= state.maximum) {
      input.classList.add("invalid_input");
    }
    else {
      input.classList.remove("invalid_input");
      Utils.saveData(storageKeys.minimum, value);
      state.minimum = value;
    }
  });

  $<HTMLElement>("#range_to").addEventListener("input", (e) => {
    const input = <HTMLInputElement>e.target;
    const value = numberize(input.value);
    if (isNaN(value) || value <= state.minimum) {
      input.classList.add("invalid_input");
    }
    else {
      input.classList.remove("invalid_input");
      Utils.saveData(storageKeys.maximum, value);
      state.maximum = value;
    }
  });

  $<HTMLInputElement>("#read_number").addEventListener("input", (e) => {
    const target = <HTMLInputElement>e.target;
    const checked = target.checked;
    state.readNumber = checked;
    Utils.saveData(storageKeys.readNumber, checked);
  });

  $<HTMLInputElement>("#play_audio").addEventListener("input", (e) => {
    const target = <HTMLInputElement>e.target;
    const checked = target.checked;
    state.playAudio = checked;
    Utils.saveData(storageKeys.playAudio, checked);
  });

  $<HTMLInputElement>("#timer_duration").addEventListener("input", (e) => {
    const target = <HTMLInputElement>e.target;
    const value = parseInt(target.value, 10);
    if (!isNaN(value)) {
      state.timerDuration = value;
      target.classList.remove("invalid_input");
      Utils.saveData(storageKeys.timerDuration, value);
    } else {
      target.classList.add("invalid_input");
    }
  });

  $<HTMLInputElement>("#select_divider").addEventListener("input", (e) => {
    const target = <HTMLInputElement>e.target;
    const value = target.value;
    if (value === "custom") {
      $$("#custom_divider, label[for='custom_divider']")
        .forEach(elm => {
          const element = <HTMLElement>elm;
          element.style.display = "inline";
        });
    } else {
      $$("#custom_divider, label[for='custom_divider']")
        .forEach(elm => {
          const element = <HTMLElement>elm;
          element.style.display = "none";
        });
      state.divider = value;
      Utils.saveData(storageKeys.divider, value);
    }
  });

  $<HTMLInputElement>("#custom_divider").addEventListener("input", (e) => {
    const target = <HTMLInputElement>e.target;
    const value = target.value;
    state.divider = value;
    Utils.saveData(storageKeys.divider, value);
  });

  document.addEventListener("resize, orientationchange", adjustStyles);

  document.addEventListener("keyup", (event: KeyboardEvent) => {
    if (!state.running && event.key === " ") {
      event.preventDefault();
      roll(event);
    }
  });

  $<HTMLElement>("#number").addEventListener("click", (event) => {
    if (!state.running) {
      event.preventDefault();
      roll(event);
    }
  });

  // Initializing...
  adjustStyles();
  adjustFontSize();

  // show setting
  $<HTMLInputElement>("#range_from").value = state.minimum + "";
  $<HTMLInputElement>("#range_to").value = state.maximum + "";
  $<HTMLInputElement>("#timer_duration").value = state.timerDuration + "";
  $<HTMLInputElement>("#play_audio").checked = state.playAudio;
  $<HTMLInputElement>("#read_number").checked = state.readNumber;

  if (!Voice.isAvailable) {
    const readNumber = $<HTMLInputElement>("#read_number");
    readNumber.disabled = true;
    readNumber.checked = false;
  }

  if (![".", ",", " ", ""].includes(state.divider)) {
    $<HTMLInputElement>("#custom_divider").value = state.divider;
    $$("#custom_divider, label[for='custom_divider']")
      .forEach(elm => {
        const element = <HTMLElement>elm;
        element.style.display = "inline";
      });
    $<HTMLInputElement>("#select_divider").value = "custom";
  } else {
    $$("#custom_divider, label[for='custom_divider']")
      .forEach(elm => {
        const element = <HTMLInputElement>elm;
        element.style.display = "none";
      });
    $<HTMLInputElement>("#select_divider").value = state.divider;
  }
};

wrap();
