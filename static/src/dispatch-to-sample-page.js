const drawContentPage = function () {
    const params = new URLSearchParams(window.location.search)
    const path = params.get("page");
    document.getElementById("content-iframe").src = path;
    console.log(path)
}

drawContentPage()