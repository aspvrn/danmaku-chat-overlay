const $ = (id) => document.getElementById(id);

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

if (RUNTIME.devMode) {
  restartDevChat();
}

// NOTE: Dev UI simulates REAL StreamElements payloads.
// Do not simplify payloads here or it will mask bugs.


$("toggleDev").onchange = (e) => {
  RUNTIME.devMode = e.target.checked;
  applyRuntime();
};

$("delay").oninput = (e) => {
  RUNTIME.devDelay = Number(e.target.value);
  applyRuntime();
};

$("fontSize").oninput = (e) => {
  RUNTIME.fontSize = Number(e.target.value);
  applyRuntime();
};


$("laneGap").oninput = (e) => {
  RUNTIME.laneGap = Number(e.target.value);
  applyRuntime();
};


$("baseSpeed").oninput = e => {
  RUNTIME.baseSpeed = Number(e.target.value);
};






// Event Simmulation
// NOTE: Dev UI simulates REAL StreamElements payloads.
// Do not simplify payloads here or it will mask bugs.


$("dev-chat").onclick = () => {
  detectEvent({
    type: "message",
    data: {
      displayName: rand(DEV_NAMES),
      text: rand(DEV_MESSAGES)
    }
  });
};

$("dev-sub").onclick = () => {
  detectEvent({
    type: "sponsor",
    data: {
      displayName: rand(DEV_NAMES)
    }
  });
};

$("dev-gift-1").onclick = () => {
  detectEvent({
    type: "sponsor",
    data: {
      gifted: true,
      sender: rand(DEV_NAMES),
      displayName: rand(DEV_NAMES),
      amount: 1
    }
  });
};

$("dev-gift-bulk").onclick = () => {
  const count = Number($("dev-gift-count").value) || 1;

  const gifter = rand(DEV_NAMES);

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      detectEvent({
        type: "sponsor",
        data: {
          gifted: true,
          bulkGifted: true,
          sender: gifter,
          displayName: rand(DEV_NAMES),
          amount: 1
        }
      });
    }, i * 80);
  }
};

$("dev-tip-10").onclick = () => {
  detectEvent({
    type: "tip",
    amount: 10,
    displayName: rand(DEV_NAMES)
  });
};

$("dev-tip-50").onclick = () => {
  detectEvent({
    type: "tip",
    amount: 50,
    displayName: rand(DEV_NAMES)
  });
};

$("dev-tip-custom").onclick = () => {
  const ammount = Number($("dev-tip-ammount").value) || 1;
  detectEvent({
    type: "tip",
    amount: ammount,
    displayName: rand(DEV_NAMES)
  });
};

$("dev-superchat").onclick = () => {
  detectEvent({
    type: "superchat",
    amount: 25,
    currency: "USD",
    message: rand(DEV_MESSAGES),
    displayName: rand(DEV_NAMES)
  });
};

$("dev-spam").onclick = () => {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      detectEvent({
        type: "message",
        data: {
          displayName: rand(DEV_NAMES),
          text: rand(DEV_SPAM)
        }
      });
    }, i * 100);
  }
};