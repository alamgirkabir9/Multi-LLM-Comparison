# Multi-LLM Comparison Dashboard

A comprehensive web application for comparing responses from multiple Large Language Models (LLMs) side-by-side. Test different AI models with the same prompt and evaluate their performance, response quality, and speed.

![Dashboard Preview](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi) ![Python](https://img.shields.io/badge/python-3.8+-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌐 Live Demo

**[🚀 Try the Live Demo](https://multi-llm-comparison.onrender.com/)

> **Note**: The demo may require you to provide your own API keys for the models you want to test. You can add them through the Settings page once you access the demo.

## ✨ Features

- **Multi-Model Comparison**: Compare responses from 6 different LLM models simultaneously
- **Real-time Performance Metrics**: Track response times, token usage, and model efficiency
- **Rating System**: Rate and compare model responses on a 1-5 scale
- **Query History**: Keep track of all your previous queries and responses
- **Model Leaderboard**: See which models perform best based on ratings and speed
- **Secure API Key Management**: Store API keys securely in sessions
- **Responsive Web Interface**: Clean, modern UI that works on desktop and mobile

## 🤖 Supported Models

| Model | Provider | Description |
|-------|----------|-------------|
| **LLaMA 3 70B** | Meta (via Groq) | Most powerful general-purpose model with 70B parameters |
| **LLaMA 3.1 8B** | Meta (via Groq) | Smaller, faster model optimized for instant responses |
| **Mistral Saba 24B** | Mistral (via Groq) | Production model balancing power and speed |
| **QwQ 32B** | Alibaba (via Groq) | General-purpose model with strong reasoning capabilities |
| **DeepSeek R1 Distill 70B** | DeepSeek (via Groq) | Powerful distilled model for coding and reasoning |
| **GPT-3.5 Turbo** | OpenAI | Fast and cost-effective model for everyday tasks |

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- API keys for the models you want to use (see [API Keys Setup](#api-keys-setup))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alamgirkabir9/Multi-LLM-Comparison.git
   cd Multi-LLM-Comparison
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Run the application**
   ```bash
   uvicorn main:app --reload
   ```

6. **Open your browser**
   Navigate to `http://localhost:8000`

## 🔑 API Keys Setup

You can configure API keys in two ways:

### Method 1: Environment Variables (Recommended)
Create a `.env` file in the project root:

```env
LLAMA3_70B_API_KEY=your_groq_api_key_here
LLAMA_3_1_8B_API_KEY=your_groq_api_key_here
MISTRAL_SABA_API_KEY=your_groq_api_key_here
QWEN_QWQ_API_KEY=your_groq_api_key_here
DEEPSEEK_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Method 2: Web Interface
1. Start the application
2. Go to the Settings page
3. Enter your API keys for each model you want to use
4. Keys are stored securely in your browser session

### Getting API Keys

- **Groq API** (for LLaMA, Mistral, QwQ, DeepSeek models): [console.groq.com](https://console.groq.com)
- **OpenAI API** (for GPT-3.5): [platform.openai.com](https://platform.openai.com)

## 📖 Usage

### Basic Comparison
1. Enter your query in the text box
2. Select which models you want to compare
3. Click "Compare Models"
4. View side-by-side responses with performance metrics

### Rating Responses
- Rate each model's response from 1-5 stars
- Ratings contribute to the overall model leaderboard
- Help identify which models work best for different types of queries

### Viewing History
- Access all previous queries and responses
- See performance trends over time
- Export or reference previous comparisons

### Leaderboard
- View models ranked by average rating and performance
- Identify the best-performing models for your use cases

## 🛠️ Development

### Project Structure
```
Multi-LLM-Comparison/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── templates/             # HTML templates
│   ├── index.html         # Main dashboard
│   ├── results.html       # Comparison results
│   ├── history.html       # Query history
│   ├── leaderboard.html   # Model rankings
│   └── settings.html      # API key configuration
└── static/               # CSS, JS, and assets
```

### Adding New Models

To add support for a new model:

1. **Update the MODELS dictionary** in `main.py`:
   ```python
   "new-model-id": {
       "name": "Model Display Name",
       "endpoint": "https://api.provider.com/v1/chat/completions",
       "description": "Brief description of the model",
       "color": "#HEX_COLOR",
       "icon": "icon_name"
   }
   ```

2. **Add the API key configuration** in `DEFAULT_API_KEYS`

3. **Update templates** to include the new model in the UI

### Running in Production

For production deployment:

```bash
# Set production environment variables
export HOST=0.0.0.0
export PORT=8000

# Run with Gunicorn (recommended)
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --host 0.0.0.0 --port 8000
```

## 📊 Features Overview

### Performance Metrics
- **Response Time**: How quickly each model responds
- **Token Usage**: Input/output token counts for cost estimation
- **Success Rate**: Model reliability and error handling

### Comparison Features
- **Side-by-side Display**: Easy visual comparison of responses
- **Syntax Highlighting**: Code responses are properly formatted
- **Export Options**: Save comparisons for later reference

### Analytics
- **Usage Statistics**: Track which models you use most
- **Performance Trends**: See how models perform over time
- **Rating Analytics**: Understand which models work best for different tasks

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [Groq](https://groq.com/) for providing high-speed LLM inference
- [OpenAI](https://openai.com/) for GPT models
- All the open-source model creators and maintainers

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/alamgirkabir9/Multi-LLM-Comparison/issues) page
2. Create a new issue with detailed information
3. Join the discussion in existing issues

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Support for 6 LLM models
- Basic comparison functionality
- Rating system
- History tracking
- Leaderboard

---

**Made with ❤️ by [Alamgir Kabir](https://github.com/alamgirkabir9)**
