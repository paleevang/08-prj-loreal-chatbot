/* Page elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendButton = document.getElementById("sendBtn");

// Send chat requests through the deployed Cloudflare Worker.
const workerURL = 'https://dawn-bush-18a4.ppvang.workers.dev/';

// Keep the conversation so the advisor can use earlier messages as context.
const conversationMessages = [];
const beautyAdvisorInstructions = `You are L’Oréal’s Beauty Advisor. Only help with L’Oréal products, product use, beauty topics, skincare, haircare, makeup, fragrance, routines, and recommendations. Politely refuse unrelated requests and invite the user to ask about L’Oréal or beauty instead. Be concise, inclusive, and honest; do not invent product details or make medical diagnoses. For health concerns, suggest consulting a qualified healthcare professional.`;

function addChatMessage(text, sender) {
  const message = document.createElement("p");
  message.className = `msg ${sender}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

addChatMessage("👋 Hello! How can I help you today?", "ai");

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (sendButton.disabled) {
    return;
  }

  const userMessage = userInput.value.trim();
  if (!userMessage) {
    return;
  }

  addChatMessage(userMessage, "user");
  userInput.value = "";
  conversationMessages.push({ role: "user", content: userMessage });
  sendButton.disabled = true;

  const thinkingMessage = addChatMessage("Thinking", "ai");
  thinkingMessage.classList.add("thinking");
  thinkingMessage.setAttribute("role", "status");
  thinkingMessage.setAttribute("aria-live", "polite");

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
    thinkingMessage.classList.remove("thinking");
    thinkingMessage.textContent = reply;
  } catch (error) {
    console.error("Could not get a reply from the Cloudflare Worker:", error);
    conversationMessages.pop();
    thinkingMessage.classList.remove("thinking");
    thinkingMessage.textContent =
      "Sorry, I couldn’t reach the beauty advisor. Please try again.";
  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
});
