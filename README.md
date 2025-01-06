# 📜 AI Legal Chatbot for UK Crypto Law  

### 🔍 Project Overview  
This project is an AI chatbot that answers legal and compliance questions based on **The Founder’s Guide to UK Crypto Law**. The chatbot leverages **Google Gemini AI** with **context caching** to provide accurate responses directly from the guide.

---

## 🚧 Development Journey  
Initially, I attempted to upload the PDF to **AWS S3** and pass the URL to Gemini, but the API didn’t support direct URL uploads. I then tried sending the PDF in chunks, but this was inefficient and inconsistent. The final solution involved extracting the PDF text into a `.txt` file and uploading it directly to Gemini AI for caching, ensuring all answers come from the cached content without external sources.

---

## 💡 Key Features  
- **Context-Aware Guidance** – Summarizes legal sections in plain English.  
- **Search and Indexing** – Retrieves specific sections from the cached text.  
- **Follow-Up Suggestions** – Recommends further reading or expert consultation.  
- **Accurate Responses** – Answers strictly from the uploaded text.  
- **Disclaimers** – Persistent footer and initial modal to clarify that the AI is not a lawyer.  

---

## 🛠️ Tech Stack  
- **Frontend** – Next.js (App Router), React, TailwindCSS, shadcn/ui  
- **AI** – Google Gemini AI (context caching)  
- **Backend** – Node.js (for file uploads and caching)  
- **Rendering** – React-Markdown for bot responses  

---

## 🏗️ How It Works  
1. **PDF to TXT Conversion** – The PDF is extracted to a `.txt` file.  
2. **Caching** – TXT is uploaded to Gemini AI for context caching.  
3. **Bot Interaction** – Users submit queries, and Gemini fetches answers from the cached content.  

---

## 🚀 Setup & Installation  
### 1. Clone the Repository  
```bash
git clone https://github.com/yourusername/ai-legal-chatbot.git
cd ai-legal-chatbot
```

### 2. Install Dependencies  
```bash
npm install
```

### 3. Environment Variables  
Create a `.env.local` file in the root directory:  
```plaintext
NEXT_PUBLIC_GEMINI_API_KEY=your_google_api_key
```

### 4. Start the Development Server  
```bash
npm run dev
```

---

## 📂 Project Structure  
```
/public
  └── file.txt           # Extracted text from PDF
/src
  └── app
      └── api
          └── upload
              └── route.ts   # TXT upload and caching logic
      └── page.tsx       # Main Chatbot UI and logic
/components
  └── ui
      └── modeToggle.tsx # Light/Dark mode switch
```

---

## ⚠️ Disclaimer  
This chatbot is for **educational purposes** only. It provides guidance based on cached content from *The Founder’s Guide to UK Crypto Law*.  
- **This AI is not a lawyer.**  
- For formal legal advice, consult a licensed legal professional.  

For inquiries, contact: [legal@ukcrypto.com](mailto:legal@ukcrypto.com)  

---

**Contributions welcome!** Feel free to open an issue or PR to enhance the project.