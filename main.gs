
// Application entry post, fired on get request to page root.
function doGet(e) {
  console.log("Hello, application!");
  return HtmlService.createHtmlOutput("<h1>Hello, world!</h1>");
}
