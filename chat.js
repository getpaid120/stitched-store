// Stitched AI Support Chat — knowledge base + Q&A engine
// Runs entirely client-side with pattern matching

const CHAT_KB = [
  {
    keywords: ['shipping', 'delivery', 'ship', 'deliver', 'track', 'tracking', 'arrive', 'arrived', 'when'],
    answer: 'We offer worldwide shipping on all orders. Standard shipping takes 7–14 business days. Free shipping on orders over $50! You\'ll receive a tracking number via email once your order ships.'
  },
  {
    keywords: ['return', 'refund', 'money back', 'exchange', 'replace', 'returning'],
    answer: 'We accept returns within 30 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5–7 business days after we receive the item. Contact us at contact@stitched.store to start a return.'
  },
  {
    keywords: ['damage', 'damaged', 'broken', 'wrong', 'incorrect', 'defect', 'defective'],
    answer: 'If you receive a damaged or incorrect item, contact us within 48 hours of delivery at contact@stitched.store. We\'ll arrange a replacement or full refund, including return shipping costs.'
  },
  {
    keywords: ['price', 'pricing', 'cost', 'cheap', 'expensive', 'money', 'save', 'sale', 'discount'],
    answer: 'Our prices are competitive and we regularly review them. Keep an eye on the store for new arrivals and great deals. Free shipping on orders over $50!'
  },
  {
    keywords: ['payment', 'pay', 'card', 'credit', 'debit', 'secure', 'safe', 'paypal'],
    answer: 'We accept major credit and debit cards. All payments are processed securely. Your payment information is encrypted and never stored on our servers.'
  },
  {
    keywords: ['product', 'quality', 'authentic', 'real', 'genuine', 'material'],
    answer: 'Every product in our catalog is carefully curated from trusted suppliers. We verify quality and authenticity so you can shop with confidence.'
  },
  {
    keywords: ['size', 'fit', 'measurement', 'small', 'large', 'medium'],
    answer: 'Product sizes and measurements are listed in the product description. If you need more specific sizing info, reach out to us at contact@stitched.store and we\'ll help!'
  },
  {
    keywords: ['order', 'cancel', 'change', 'modify', 'update'],
    answer: 'Need to modify or cancel an order? Contact us ASAP at contact@stitched.store. We\'ll do our best to help if the order hasn\'t shipped yet.'
  },
  {
    keywords: ['account', 'sign in', 'login', 'password', 'register', 'sign up', 'profile'],
    answer: 'You can create an account by clicking "Sign Up" in the top bar. Once signed in, you can view your orders, track shipments, and check out faster.'
  },
  {
    keywords: ['contact', 'email', 'phone', 'call', 'support', 'help', 'human', 'agent'],
    answer: 'You can reach us at contact@stitched.store. Our support team is available Monday–Friday, 9AM–6PM. We typically respond within 24 hours.'
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    answer: 'Hey there! 👋 Welcome to Stitched. How can I help you today? You can ask about shipping, returns, products, orders, or anything else!'
  },
  {
    keywords: ['thanks', 'thank you', 'appreciate', 'grateful'],
    answer: 'You\'re welcome! 😊 Happy to help. If you need anything else, just ask.'
  },
  {
    keywords: ['faq', 'question', 'questions', 'frequently'],
    answer: 'Here are common questions I can answer: Shipping times, Returns & Refunds, Order Changes, Account Help, Payment Security, Product Quality. Just ask away!'
  },
];

const CHAT_GREETING = 'Hi! 👋 I\'m the Stitched support assistant. Ask me about shipping, returns, orders, products, or anything else!';

function chatFindAnswer(query) {
  const q = query.toLowerCase();
  
  // Check for direct category queries
  for (const item of CHAT_KB) {
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        return item.answer;
      }
    }
  }
  
  // Fallback
  return 'Great question! For the most accurate info, you can email us at contact@stitched.store or check our Shipping & Returns page. Is there something specific I can help with?';
}

function chatAddMessage(text, isUser = false) {
  const msgs = document.getElementById('chatMsgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = `chat-msg ${isUser ? 'chat-user' : 'chat-bot'}`;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function chatSend() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  
  chatAddMessage(text, true);
  input.value = '';
  
  // Simulate thinking
  const thinking = document.createElement('div');
  thinking.className = 'chat-msg chat-bot chat-thinking';
  thinking.textContent = '…';
  document.getElementById('chatMsgs').appendChild(thinking);
  
  setTimeout(() => {
    thinking.remove();
    const answer = chatFindAnswer(text);
    chatAddMessage(answer);
  }, 400 + Math.random() * 300);
}

function chatToggle() {
  const panel = document.getElementById('chatPanel');
  const bubble = document.getElementById('chatBubble');
  if (!panel) return;
  const open = panel.classList.toggle('chat-open');
  bubble.style.display = open ? 'none' : 'flex';
  if (open) {
    const msgs = document.getElementById('chatMsgs');
    if (msgs && msgs.children.length === 0) {
      chatAddMessage(CHAT_GREETING);
    }
    const input = document.getElementById('chatInput');
    if (input) setTimeout(() => input.focus(), 300);
  }
}

// Handle Enter key
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement?.id === 'chatInput') {
      e.preventDefault();
      chatSend();
    }
  });
});
