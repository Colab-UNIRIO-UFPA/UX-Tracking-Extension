const serverUrl = "http://lpo.ddns.net:8080/webtracer/";
function post(endpoint, data) {
  return fetch(serverUrl + "/" + endpoint, {
    method: "POST",
    body: JSON.stringify(data)
  });
}
