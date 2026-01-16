tsParticles.load("tsparticles", {
  fpsLimit: 60,
  particles: {
    number: {
      value: 50,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: ["#FF6B6B", "#4ECDC4", "#FFE66D"],
    },
    shape: {
      type: "circle",
    },
    opacity: {
      value: 0.6,
      random: true,
    },
    size: {
      value: 4,
      random: { enable: true, minimumValue: 1 },
    },
    links: {
      color: "#333333",
      distance: 150,
      enable: true,
      opacity: 0.2,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "grab",
      },
      onclick: {
        enable: true,
        mode: "push",
      },
      resize: true,
    },
    modes: {
      grab: {
        distance: 140,
        links: {
          opacity: 0.5,
        },
      },
      push: {
        quantity: 2,
      },
    },
  },
  retina_detect: true,
  background: {
    color: "transparent",
  },
});
