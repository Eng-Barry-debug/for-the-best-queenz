// Dynamically load header and footer
document.addEventListener('DOMContentLoaded', function() {
    // Load header
    var xhrHeader = new XMLHttpRequest();
    xhrHeader.open('GET', 'components/header.html', true);
    xhrHeader.onreadystatechange = function() {
        if (xhrHeader.readyState === 4 && xhrHeader.status === 200) {
            document.getElementById('header').innerHTML = xhrHeader.responseText;
        }
    };
    xhrHeader.send();

    // Load footer
    var xhrFooter = new XMLHttpRequest();
    xhrFooter.open('GET', 'components/footer.html', true);
    xhrFooter.onreadystatechange = function() {
        if (xhrFooter.readyState === 4 && xhrFooter.status === 200) {
            document.getElementById('footer').innerHTML = xhrFooter.responseText;
        }
    };
    xhrFooter.send();
});