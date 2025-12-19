// 2025css-demo.js
// 用于2025css.html的交互增强

document.addEventListener("DOMContentLoaded", () => {
  // dialog 交互
  document.querySelectorAll("button[commandfor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("commandfor");
      const dialog = document.getElementById(id);
      if (dialog) dialog.showModal();
    });
  });

  // range 控制变量字体
  const fontRange = document.getElementById("font-range");
  const varText = document.getElementById("var-text");
  if (fontRange && varText) {
    fontRange.addEventListener("input", (e) => {
      varText.style.setProperty("--font-size", fontRange.value + "px");
    });
  }

  // color-mix 交互
  const colorMixRange = document.getElementById("color-mix-range");
  const colorMixBox = document.getElementById("color-mix-box");
  if (colorMixRange && colorMixBox) {
    colorMixRange.addEventListener("input", () => {
      colorMixBox.style.background = `color-mix(in srgb, red ${colorMixRange.value}%, blue)`;
    });
  }

  // :has 交互
  const hasDemo = document.getElementById("has-demo");
  if (hasDemo) {
    hasDemo.addEventListener("click", (e) => {
      hasDemo.classList.toggle("active");
    });
  }
});
