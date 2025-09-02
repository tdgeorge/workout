// This file contains the JavaScript code for the website. It initializes the page and displays a "Hello World" message.

document.addEventListener('DOMContentLoaded', () => {
    const message = document.createElement('h1');
    message.textContent = 'Hello World';
    document.body.appendChild(message);
});