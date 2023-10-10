function main() {
  console.log("Hello from TypeScript!");
  const h1 = document.createElement("h1");
  h1.innerText = "Hello, Web Pack!";
  document.body.appendChild(h1);
}

window.onload = main;
