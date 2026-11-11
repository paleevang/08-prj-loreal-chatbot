/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// REPLACED with my actual Cloudflare Worker URL - already did this! This keeps the API hidden and protected.
const workerURL = 'https://dawn-bush-18a4.ppvang.workers.dev';

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content

  // Show message
  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

// Add L'Oréal branding without changing the existing page markup.
const brandHeader = document.querySelector(".site-header");
const brandLogo = document.createElement("img");
brandLogo.src = "img/loreal-logo.png";
brandLogo.alt = "L'Oréal";
brandLogo.className = "brand-logo";
brandHeader.insertBefore(brandLogo, brandHeader.firstChild);
document.querySelector(".site-title").textContent = "Beauty Advisor";
document.querySelector(".site-footer p").innerHTML =
  "&copy; 2025 L’Oréal. All rights reserved.";

// Keep the conversation so the advisor can use earlier messages as context.
const conversationMessages = [];
const beautyAdvisorInstructions = `You are L’Oréal’s Beauty Advisor. Only help with L’Oréal products, product use, beauty topics, skincare, haircare, makeup, fragrance, routines, and recommendations. Politely refuse unrelated requests and invite the user to ask about L’Oréal or beauty instead. Be concise, inclusive, and honest; do not invent product details or make medical diagnoses. For health concerns, suggest consulting a qualified healthcare professional.`;
const beautyChatForm = document.getElementById("chatForm");
const beautyChatWindow = document.getElementById("chatWindow");
const beautyUserInput = document.getElementById("userInput");
const beautySendButton = document.getElementById("sendBtn");

function addChatMessage(text, sender) {
  const message = document.createElement("p");
  message.className = `msg ${sender}`;
  message.textContent = text;
  beautyChatWindow.appendChild(message);
  beautyChatWindow.scrollTop = beautyChatWindow.scrollHeight;
}

beautyChatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (beautySendButton.disabled) {
    return;
  }

  const userMessage = beautyUserInput.value.trim();
  if (!userMessage) {
    return;
  }

  addChatMessage(userMessage, "user");
  beautyUserInput.value = "";
  conversationMessages.push({ role: "user", content: userMessage });
  beautySendButton.disabled = true;

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: beautyAdvisorInstructions },
          ...conversationMessages,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker returned HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "The Worker is online, but it is not returning chatbot data yet. Deploy the chat handler to your Cloudflare Worker, then try again.",
      );
    }

    const data = await response.json();
    const reply =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("Worker response did not contain an assistant reply");
    }

    conversationMessages.push({ role: "assistant", content: reply });
    addChatMessage(reply, "ai");
  } catch (error) {
    console.error("Could not get a reply from the Cloudflare Worker:", error);
    conversationMessages.pop();
    addChatMessage(error.message, "ai");
  } finally {
    beautySendButton.disabled = false;
    beautyUserInput.focus();
  }
});
