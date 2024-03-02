const drawContentPage = function () {
    const params = new URLSearchParams(window.location.search)
    const path = params.get("page");
    var iframe = document.getElementById("content-iframe");
    iframe.src = path;
    // iframe.width = iframe.contentWindow.document.body.scrollWidth;
    iframe.height = iframe.contentWindow.document.body.scrollHeight;
    console.log(path)
}

drawContentPage()